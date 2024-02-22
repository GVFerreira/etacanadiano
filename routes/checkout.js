const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')
require('../models/Visa')
const Visa = mongoose.model("visa")
require('../models/Payment')
const Payment = mongoose.model("payment")

const dotenv = require('dotenv')
dotenv.config()

const bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({extended: true}))
router.use(bodyParser.json({
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/checkout/webhook')) {
        req.rawBody = buf.toString()
      }
    }
  })
)

const nodemailer = require('nodemailer')
const { transporter, handlebarOptions } = require('../helpers/senderMail')
const hbs = require('nodemailer-express-handlebars')

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const publishable_key = process.env.STRIPE_PUBLISHABLE_KEY


router.get('/', async (req, res) => {
  try {
    const sessionaData = req.session.aplicacaoStep
    if('visaID' in sessionaData) {
      const title = 'Checkout - '

      const aplicacoes = req.session.aplicacoes
      //const aplicacoes = [{codeETA: '7QIZA', firstName: 'Gustavo', surname: 'Ferreira'}, {codeETA: '7QIZB', firstName: 'Bruna', surname: 'Santos'}]
      
      const visas = req.session.visas.ids
      //const visas = ['65a9be7d3de620fddc6581eb']

      const qtyVisas = aplicacoes.length

      if(!req.session.client_secret) {
        const paymentIntent = await stripe.paymentIntents.create({
          //amount: qtyVisas * 4900,
          amount: qtyVisas * 100,
          description: 'Solicitação de Autorização de Viagem - Canadiano',
          currency: 'BRL',
          receipt_email: aplicacoes[0].contactEmail,
          metadata: { internalPayment: "" },
          automatic_payment_methods: { enabled: true }
        })
    
        req.session.payment_id = paymentIntent.id
        req.session.client_secret = paymentIntent.client_secret

        const payment = await Payment.create({
          transaction_amount: paymentIntent.amount / 100,
          transactionId: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: 'Checkout em andamento',
          visaIDs: visas,
          updatedAt: null,
          createdAt: new Date(paymentIntent.created * 1000).toISOString()
        })
        await payment.save()

        for (const idVisa of visas) {
          const visa = await Visa.findOne({_id: idVisa})
          if (visa) {
            await Visa.updateOne({ _id: visa._id }, { $set: { pagamento: payment._id } })
          }
        }

        const savedPaymentID = payment._id.toString()
        await stripe.paymentIntents.update( req.session.payment_id,
          { metadata: {
              internalPayment: savedPaymentID
            }
          }
        )
    
        res.render('checkout/index', {
          title,
          publishable_key,
          client_secret: paymentIntent.client_secret,
          qtyVisas,
          aplicacoes
        })
      } else {
        await stripe.paymentIntents.update(req.session.payment_id,
          { amount: qtyVisas * 100 }
        )

        for (const idVisa of visas) {
          const visa = await Visa.findOne({_id: idVisa})
          if (visa) {
            const payment = await Payment.findOne({transactionId: req.session.payment_id})
            await Visa.updateOne({ _id: visa._id }, { $set: { pagamento: payment._id } })
          }
        }

        await Payment.updateOne({ client_secret: req.session.client_secret }, { $set: { visaIDs: visas, transaction_amount: qtyVisas * 1} })

        res.render('checkout/index', {
          title,
          publishable_key,
          client_secret: req.session.client_secret,
          visas,
          qtyVisas,
          aplicacoes
        })
      }
    } else {
      req.flash('error_msg', 'Os campos na etapa 4 devem ser preenchidos.')
      res.redirect(`/aplicacao?etapa=4`)
    }
  } catch (err) {
    console.log(err)
    req.flash('error_msg', `${err}`)
    res.redirect('/checkout')
  }
  
})

// router.get('/retry/:id', async (req, res) => {
//   const title = 'Checkout - '
//   const payment = await Payment.findOne({transactionId: req.params.id}).populate('visaIDs')
//   const qtyVisas = payment.visaIDs.length
//   const aplicacoes = payment.visaIDs
  
//   res.render('checkout/retry', { payment, client_secret: payment.client_secret, qtyVisas, aplicacoes, title, publishable_key })
// })

// router.post('/retry', (req, res) => {

// })

router.get('/status', (req, res) => {
  const sessionaData = req.session.aplicacaoStep
  if('visaID' in sessionaData) {
    res.render('checkout/status', { publishable_key })
  } else {
    req.flash('error_msg', 'Os campos na etapa 4 devem ser preenchidos.')
    res.redirect(`/aplicacao?etapa=4`)
  }
})

router.get('/obrigado', (req, res) => {
  const { status, transaction_id } = req.query
  res.render('checkout/obrigado', { status, transaction_id })
})

router.get('/recusado', (req, res) => {
  const { status, transaction_id } = req.query
  res.render('checkout/recusado', { status, transaction_id })
})

router.get('/em_processo', (req, res) => {
  const { status, transaction_id } = req.query
  res.render('checkout/em_processo', { status, transaction_id })
})

// WEBHOOK SETTINGS
router.post('/webhook', async (req, res) => {
  const event = req.body
  const paymentIntent = event.data.object

  if (event.type === 'payment_intent.succeeded') {
    const payment = await Payment.findOne({_id: paymentIntent.metadata.internalPayment})
    for (const visaID of payment.visaIDs) {
      const visa = await Visa.findOne({ _id: visaID })
      
      if (paymentIntent.status === 'succeeded') {
        transporter.use('compile', hbs(handlebarOptions))

        transporter.sendMail({
          from: `eTA Canadiano <${process.env.CANADIANO_SENDER_MAIL}>`,
          to: visa.contactEmail,
          bcc: process.env.CANADIANO_RECEIVER_MAIL,
          subject: `Confirmação de Recebimento Código ${visa.codeETA} - Autorização Eletrônica de Viagem Canadiana`,
          template: 'aviso-eta',
        },
        (err, {response, envelope, messageId}) => {
            if(err) {
              console.error("Webhook (aviso-eta): " + new Date())
              console.error(err)
            } else {
              console.log({origem: `Webhook (aviso-eta): ${new Date()}`, response, envelope, messageId})
            }
        })

        transporter.sendMail(
          {
            from: `eTA Canadiano <${process.env.CANADIANO_SENDER_MAIL}>`,
            to: process.env.CANADIANO_RECEIVER_MAIL,
            subject: 'Pagamento aprovado',
            template: 'pagamento-aprovado',
            context: {
              nome: visa.firstName,
              codeETA: visa.codeETA,
            }
          },
          (err, {response, envelope, messageId}) => {
              if(err) {
                console.error("Webhook (pagamento-aprovado): " + new Date())
                console.error(err)
              } else {
                console.log({origem: `Webhook (pagamento-aprovado): ${new Date()}`, response, envelope, messageId})
              }
          })
      } /*else if (paymentIntent.status === 'requires_payment_method') {
        transporter.use('compile', hbs(handlebarOptions))
        transporter.sendMail({
          from: `eTA Canadiano <${process.env.CANADIANO_SENDER_MAIL}>`,
          to: visa.contactEmail,
          bcc: 'contacto@etacanadiano.pt',
          subject: 'Pagamento recusado',
          template: 'pagamento-recusado',
          context: {
            nome: visa.firstName,
            codeETA: visa.codeETA,
            transactionid: payment._id
          }
        },
        (err, {response, envelope, messageId}) => {
          if(err) {
            console.error("Webhook (pagamento-recusado): " + new Date())
            console.error(err)
          } else {
            console.log({origem: `Webhook (pagamento-recusado): ${new Date()}`, response, envelope, messageId})
          }
        })
      }*/
    }

    if(payment) {
      await Payment.updateOne({ transactionId: paymentIntent.id },
        { $set: { 
            status: paymentIntent.status,
            updatedAt: new Date(event.created * 1000).toISOString()
          }
        }
      )
    }
  }
  
  res.json({received: true})
})

module.exports = router