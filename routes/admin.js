const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')
    require('../models/User')
const User = mongoose.model("users")
    require('../models/Visa')
const Visa = mongoose.model("visa")
    require('../models/Payment')
const Payment = mongoose.model("payment")

const nodemailer = require('nodemailer')
const { transporter, handlebarOptions } = require('../helpers/senderMail')
const hbs = require('nodemailer-express-handlebars')

const bcrypt = require('bcryptjs')
const multer = require('multer')
const path = require("path")
const { connect } = require('http2')
const uploadAttach = require('../helpers/uploadAttachments')

const PDFPrinter = require("pdfmake")

const axios = require('axios')

require('dotenv').config()

/////////////////
// SOLICITAÇÃO //
/////////////////
router.get('/', async (req, res) => {
    const page = req.query.page || 1
    const sort = req.query.sort || "DESC"
    const limit = req.query.limit || 20
    const filter = req.query.filter || ''
    const visasPerPage = limit
    const skip = (page - 1) * visasPerPage

    const totalVisas = await Visa.countDocuments()

    if(filter) {
        Visa.find({numPassport: filter}).populate('pagamento').sort({createdAt: sort}).skip(skip).limit(limit).then((visas) => {
            const totalPages = Math.ceil(totalVisas / visasPerPage)
            res.render('admin/index', {visas, limit, sort, page, filter, totalPages, totalVisas, title: 'Administrativo - '})
        }).catch((err) => {
            req.flash('error_msg', 'Ocorreu um erro ao listar todos as solicitações')
            res.redirect('/')
        })
    } else {
        Visa.find().populate('pagamento').sort({createdAt: sort}).skip(skip).limit(limit).then((visas) => {
            const totalPages = Math.ceil(totalVisas / visasPerPage)
            res.render('admin/index', {visas, limit, sort, page, totalPages, totalVisas, title: 'Administrativo - '})
        }).catch((err) => {
            req.flash('error_msg', 'Ocorreu um erro ao listar todos as solicitações')
            res.redirect('/')
        })
    }
})

router.get('/details-visa/:id', (req, res) => {

    Visa.findOne({_id: req.params.id}).then((visa) => {
        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        }
    
        const printer = new PDFPrinter(fonts)

        // Formatações
        function formatarData(dataString) {
            const [ano, mes, dia] = dataString.split("-")
            return `${dia}/${mes}/${ano}`
        }
    
        const docDefinitions = {
            defaultStyle: { font: "Helvetica"},
            content: [
                {
                    columns: [
                        [
                            {
                                text: 'Informações enviadas para\n aplicação do eTA Canadiano',
                                style: 'h1header'
                            },
                            `Código de acompanhamento: ${visa.codeETA}`
                        ],
                        {
                            image: "./public/img/logo-details.png",
                            width: 100,
                            style: 'imgheader'
                        }
                    ],
                    style: 'header'
                },
                {
                    stack:[
                        {
                            stack: [
                                { text: visa.representative ? "Detalhes do responsável ou representante\n\n" : "", style: 'subheader' },
                                {
                                    text:  visa.representative ? `Aplicado por: ${visa.representativeRelationship}\n
                                        Pago para representar o requerente e preencher o formulário em seu nome? ${visa.representativePayed ? "Sim" : "Não"}\n
                                        Representado por: ${visa.representativeName} ${visa.representativeSurname}\n
                                        Nome da empresa: ${visa.representativeOrgName}\n
                                        Endereço: ${visa.representativeAddress}\n
                                        Código postal: ${visa.representativeCodpostal === undefined ? 'Não necessário' : visa.representativeCodpostal}\n
                                        Contato: ${visa.representativeEmail} | ${visa.representativeNumTel}\n
                                        Número de identificação de membro: ${visa.representativeNumIDmebro === undefined ? 'Não necessário' : visa.representativeNumIDmebro}\n
                                        Província ou território: ${visa.representativeProvOrTer === undefined ? 'Não necessário' : visa.representativeProvOrTer}
                                    ` : ''
                                }
                            ]
                        },
                        {
                            stack: [
                                { text: "Perguntas de validação\n\n", style: 'subheader' },
                                { text: `Qual documento de viagem você pretende usar para viajar ao Canadá?\n${visa.document}\n\n` },
                                { columns: [
                                        { text: `Código do passaporte: ${visa.codPassport}\n\n` },
                                        { text: `Nacionalidade do passaporte: ${visa.nationalityPassport}\n\n` }
                                    ]
                                },
                                { text: `Residente permanente legal dos Estados Unidos com um número válido dos Serviços de Cidadania e Imigração dos EUA (USCIS)? ${visa.residentUSCIS ? "Sim\n\n" : "Não\n\n"}` },
                                { text: `Está viajando para o Canadá de avião? ${visa.airplane ? "Sim\n\n" : "Não\n\n"}` },
                                { text: `Possuiu um visto canadense de residente temporário válido nos últimos 10 anos? ${visa.canadaVisa ? "Sim\n\n" : "Não\n\n"}` },
                                { text: `Atualmente possui um visto válido de não-imigrante nos EUA? ${visa.nonImmigrateVisa ? "Sim\n\n" : "Não\n\n"}` }
                            ]
                        },
                        {
                            stack: [
                                { text: visa.nonImmigrateVisa ? "Dados de não-imigrante\n\n" : "", style: 'subheader' },
                                {
                                    text: visa.nonImmigrateVisa ? `Número do visto de não imigrante nos EUA: ${visa.numVisaNonImmigrate}\n
                                    Data de expiração do visto americano de não-imigrante: ${formatarData(visa.dateVisaNonImmigrate)}\n\n` : ""
                                }
                            ]
                        },
                        {
                            stack: [
                                { text: "Dados do passaporte do requerente\n\n", style: 'subheader' },
                                { text: `Número do passaporte: ${visa.numPassport}\n\n` },
                                { columns: [
                                        { text: `Emissão do passaporte: ${formatarData(visa.doiPassport)}\n\n` },
                                        { text: `Expiração do passaporte: ${formatarData(visa.doePassport)}\n\n` },
                                    ]
                                },
                                { text: `Nome completo: ${visa.firstName} ${visa.surname}\n\n` },
                                { text: `Data de nascimento: ${formatarData(visa.dateBirthday)}\n\n` },
                                { text: `Gênero: ${visa.gender}\n\n` },
                                { columns: [
                                        { text: `Cidade/município de nascimento: ${visa.cityBirth}\n\n` },
                                        { text: `País/território de nascimento: ${visa.countryBirth}\n\n` }
                                    ]
                                }
                            ]
                        },
                        {
                            stack: [
                                { text: "Dados pessoais do requerente\n\n", style: 'subheader' },
                                { text: visa.nationalitiesExtra ? `Nacionalidade adicional: ${visa.nationalitiesExtra}\n\n` : "" },
                                { text: `Estado civil: ${visa.maritalStatus}\n\n` },
                                { text: `Já solicitou ou obteve um visto, um eTA ou uma permissão para visitar, morar, trabalhar ou estudar no Canadá? ${visa.appliedToCanada ? "Sim\n\n" : "Não\n\n"}`},
                                { text: visa.appliedToCanada ? `Identificador exclusivo do cliente (UCI) / visto canadense anterior, eTA ou número de permissão: ${visa.personalUCI}\n\n` : '' }
                            ]
                        },
                        {
                            stack: [
                                { text: "Informação de emprego\n\n", style: 'subheader' },
                                { text: `Profissão: ${visa.occupation}\n\n` },
                                { text: visa.employmentTitle ? `Cargo: ${visa.employmentTitle}\n\n` : '' },
                                { text: visa.employmentCompanyName ? `Nome do empregador ou escola, conforme o caso: ${visa.employmentCompanyName}\n\n` : '' },
                                { columns: [
                                        { text: visa.employmentCity ? `Cidade/município: ${visa.employmentCity}\n\n` : '' },
                                        { text: visa.employmentCountry ? `País/território: ${visa.employmentCountry}\n\n` : '' },
                                    ]
                                },
                                { text: visa.employmentFromDateYear ? `Desde que ano? ${visa.employmentFromDateYear}\n\n` : '' },
                            ]
                        },
                        {
                            stack: [
                                { text: "Informações de contato\n\n", style: 'subheader' },
                                { columns: [
                                        { text: `E-mail: ${visa.contactEmail}\n\n` },
                                        { text: `Celular: ${visa.contactTel}\n\n` }
                                    ]
                                }
                            ]
                        },
                        {
                            stack: [
                                { text: "Endereço residencial\n\n", style: 'subheader' },
                                { text: `Endereço: ${visa.addressName}\n\n` },
                                { columns: [ 
                                        { text: `Número: ${visa.addressNumber}\n\n`, width: '*' },
                                        { text: `Complemento: ${visa.addressComplement}\n\n`, width: '*' },
                                        ''
                                    ]
                                },
                                { columns: [
                                        { text: `Cidade/município: ${visa.addressCity}\n\n`, width: '*' },
                                        { text: `Estado/região: ${visa.addressState}\n\n`, width: '*' },
                                        { text: `País/território: ${visa.addressCountry}\n\n`, width: '*' },
                                    ]
                                }
                            ]
                        },
                        {
                            stack: [
                                { text: "Informação de viagem\n\n", style: 'subheader' },
                                { text: `Você sabe quando vai viajar para o Canadá?  ${visa.travelWhen ? "Sim\n\n" : "Não\n\n"}` },
                                { columns: [
                                        `Data da viagem ao Canadá? ${visa.travelWhen ? formatarData(visa.travelDate)+"\n\n" : "Não definido\n\n"}`,
                                        `Horário de partida do seu voo: ${visa.travelWhen ? visa.travelTime+"\n\n" : "Não definido\n\n"}`
                                    ]
                                },
                                { text: `Fuso horário de partida do voo: ${visa.travelWhen ? visa.travelTimeZone+"\n\n" : "Não definido\n\n"}` }
                            ]
                        },
                        {
                            stack: [
                                { text: "Perguntas básicas\n\n", style: 'subheader' },
                                { text: `Já teve um visto ou permissão negado, entrada negada ou ordem de deixar o Canadá ou qualquer outro país/território?  ${visa.refusedVisaToCanda ? "Sim\n\n" : "Não\n\n"}` },
                                { text: visa.refusedVisaToCanda ? `Detalhes: ${visa.refusedVisaToCandaDetails}\n\n` : ""},
                                { text: `Já cometeu, foi preso, acusado ou condenado por algum crime em qualquer país/território?  ${visa.criminalOffenceAnywhere ? "Sim\n\n" : "Não\n\n"}` },
                                { text: visa.criminalOffenceAnywhere ? `Detalhes: ${visa.criminalOffenceAnywhereDetails}\n\n` : ""},
                                { text: `Nos últimos dois anos, você foi diagnosticado com tuberculose ou esteve em contato próximo com uma pessoa com tuberculose?  ${visa.tuberculosis ? "Sim\n\n" : "Não\n\n"}` },
                                { text: `O seu contato com a tuberculose é resultado de ser um profissional de saúde?  ${visa.tuberculosisResultCareWorker ? "Sim\n\n" : "Não\n\n"}` },
                                { text: `Você já foi diagnosticado com tuberculose?  ${visa.diagnosedWithTuberculosis ? "Sim\n\n" : "Não\n\n"}` },
                                { text: `Você tem uma dessas condições? ${visa.theseConditions}\n\n` },
                                { text: `Indique brevemente se há detalhes adicionais pertinentes à sua inscrição:\n${visa.canadaDuringStayDetails}`}
                            ]
                        },
                    ],
                    margin: [15, 5, 15, 5],
                    
                },
            ],

            footer: (currentPage, pageCount) => { 
                const contador = currentPage.toString() + ' de ' + pageCount
                const dataAtual = new Date()
    
                const dia = dataAtual.getDate()
                const mes = dataAtual.getMonth() + 1
                const ano = dataAtual.getFullYear()
                const hora = dataAtual.getHours()
                const minutos = dataAtual.getMinutes()
    
                const dataHora = `${dia < 10 ? '0'+dia : dia}/${mes < 10 ? '0'+mes : mes}/${ano} ${hora < 10 ? '0'+hora : hora}:${minutos < 10 ? '0'+minutos : minutos}`
                return {
                    columns: [
                        '',
                        { text: contador, style: 'footer'},
                        { text: `Impressão: ${dataHora}`, style: 'printDate'}
                    ]
                }
            },

            styles: {
                header: {
                    margin: [15, 0]
                },
                h1header: {
                    fontSize: 18,
                    margin: [0, 0, 0, 5],
                    bold: true
                },
                imgheader: {
                    width: 90
                },
                subheader: {
                    fontSize: 12,
                    margin: [0, 10, 5, 0],
                    bold: true
                },
                footer: {
                    fontSize: 9,
                    alignment: 'center'
                },
                printDate: {
                    fontSize: 9,
                    alignment: 'right',
                    margin: [10,0]
                }
            }
        }
    
        const pdfDoc = printer.createPdfKitDocument(docDefinitions)
    
        const chunks = []
        pdfDoc.on("data", (chunk) => {
            chunks.push(chunk)
        })
    
        pdfDoc.end()
    
        pdfDoc.on("end", () => {
            const result = Buffer.concat(chunks)
            res.end(result)
        })
    }).catch((err) => {
        req.flash("error_msg", "Falha ao carregar o PDF: " + err)
        res.redirect('/admin')
    })

    
})

router.post('/edit-visa/:id', uploadAttach.array('attachments'), (req, res) => {
    Visa.findOne({_id: req.params.id}).then((visa) => {
        visa.statusETA = req.body.statusETA
        visa.attachments = req.files

        if (req.body.statusETA === 'Aprovado' || req.body.statusETA === 'Recusado') {
            transporter.use('compile', hbs(handlebarOptions))

            const subject = `${visa.firstName} ${visa.surname} - ${visa.numPassport}`.toUpperCase()
            const mailOptions = {
                from: `eTA Canadiano <${process.env.CANADIANO_SENDER_MAIL}>`,
                to: visa.contactEmail,
                replyTo: process.env.CANADIANO_RECEIVER_MAIL,
                subject,
                template: req.body.statusETA === 'Aprovado' ? 'documento' : 'documento-negado',
                attachments: req.files,
                context: {
                    clientName: visa.firstName,
                    codeETA: visa.codeETA
                }
            }

            transporter.sendMail(mailOptions, (err, {response, envelope, messageId}) => {
                if(err) {
                    console.error("Envio de eTA: " + new Date())
                    console.error(err)
                } else {
                    console.log({
                        message: `Envio de eTA: ${new Date()}`,
                        response, envelope, messageId
                    })
                }
            })
        }

        visa.save().then(() => {
            req.flash("success_msg", "Aplicação atualizada com sucesso")
            res.redirect('/admin')
        }).catch((err) => {
            req.flash("error_msg", `Houve um erro ao atualizar a aplicação. Erro: ${err}` )
            res.redirect('/admin')
        })
    }).catch((err) => {
        req.flash('error_msg', `Houve um erro ao atualizar a aplicação. Erro: ${err}`)
        res.redirect('/admin')
    })
})

router.post('/add-message/:id', (req, res) => {
    Visa.findOne({_id: req.params.id}).then((visa) => {
        visa.messageClient = req.body.messageClient
        visa.save().then(() => {
            req.flash('success_msg', 'Mensagem adicionada com sucesso')
            res.redirect('/admin')
        }).catch((err) => {
            req.flash('error_msg', `Erro ao salvar a mensagem: ${err}`)
            res.redirect('/admin')
        })
    }).catch((err) => {
        req.flash('error_msg', `Erro ao salvar a mensagem: ${err}`)
        res.redirect('/admin')
    })
})

router.get('/delete-visa/:id', (req, res) => {
    Visa.findByIdAndDelete({_id: req.params.id}).then(() => {
        req.flash('success_msg', 'Solicitação excluída com sucesso')
        res.redirect('/admin')
    }).catch((err) => {
        req.flash('error_msg', `Ocorreu um erro: ${err}`)
        res.redirect('/admin')
    })
})

///////////////
// PAGAMENTO //
///////////////
router.get('/consult-payments', async (req, res) => {
    const page = req.query.page || 1
    const sort = req.query.sort || "DESC"
    const limit = req.query.limit || 20
    const filter = req.query.filter || ''
    const paymentsPerPage = limit
    const skip = (page - 1) * paymentsPerPage

    const totalPayments = await Payment.countDocuments()

    if(filter) {
        let statusArray
        switch (filter) {
            case 'approved':
                statusArray = ['succeeded']
                break
            case 'in_process':
                statusArray = ['Checkout em andamento', 'created', 'processing', 'requires_action', 'amount_capturable_updated']
                break
            case 'rejected':
                statusArray = ['canceled', 'payment_failed', 'partially_funded']
                break
        }
        Payment.find({status: { $in: statusArray }}).populate('visaIDs').sort({createdAt: sort}).skip(skip).limit(limit).then((payments) => {
            const totalPages = Math.ceil(totalPayments / paymentsPerPage)
            res.render('admin/consult-payments', {payments, limit, sort, page, filter, totalPages, totalPayments, title: 'Consulta de pagamentos - '})
        }).catch((err) => {
            req.flash('error_msg', 'Ocorreu um erro ao listar todos os pagamentos')
            res.redirect('/')
        })
    } else {
        Payment.find().populate('visaIDs').sort({createdAt: sort}).skip(skip).limit(limit).then((payments) => {
            const totalPages = Math.ceil(totalPayments / paymentsPerPage)
            res.render('admin/consult-payments', {payments, limit, sort, page, filter, totalPages, totalPayments, title: 'Consulta de pagamentos - '})
        }).catch((err) => {
            req.flash('error_msg', 'Ocorreu um erro ao listar todos os pagamentos')
            res.redirect('/')
        })
    }
})

router.post('/create-payments/:id', async (req, res) => {
    try {
        // Obtém todos os documentos da coleção "visas"
        const visa = await Visa.findOne({_id: req.params.id})
  
        if (visa.idPayment) {
            // Verifica se já existe um pagamento com base no campo "idPayment"
            const existingPayment = await Payment.findOne({ transactionId: visa.idPayment })

            if (!existingPayment) {
            // Faz uma chamada à API do Mercado Pago para obter informações adicionais sobre o pagamento
            const response = await axios.get(`https://api.mercadopago.com/v1/payments/${visa.idPayment}`, {
                headers: {
                Authorization: `Bearer ${process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN}`
                }
            })

            // Obtém os dados relevantes da resposta da API do Mercado Pago
            const paymentData = response.data

            // Cria um novo registro na coleção "payments" com base nas informações obtidas
            const payment = await Payment.create({
                transaction_amount: paymentData.transaction_amount,
                transactionId: visa.idPayment,
                status: paymentData.status,
                status_details: paymentData.status_detail,
                payment_type_id: paymentData.payment_type_id,
                installments: paymentData.installments,
                qrCode: paymentData.qrCode || '',
                qrCodeBase64: paymentData.qrCodeBase64 || '',
                visaIDs: [visa._id],
                createdAt: new Date(paymentData.date_created)
            })

            // Atualiza o campo "pagamento" no documento Visa com o _id do pagamento criado
            await Visa.updateOne({ _id: visa._id }, { $set: { pagamento: payment._id } })
            } else {
            // Se o pagamento já existir, adiciona o _id do Visa ao array visaIDs
            existingPayment.visaIDs.push(visa._id)
            await existingPayment.save()
            }

            req.flash('success_msg', 'Pagamento atualizado')
            res.status(200).redirect('/admin')
        } else {
            req.flash('error_msg', 'Não foi possível encontrar o pagamento')
            res.status(200).redirect('/admin')
        }
      
        
    } catch (err) {
        console.error(err)
        req.flash('error_msg', err)
        res.status(500).redirect('/admin')
    }
})

/////////////
// USUÁRIO //
/////////////
router.get("/register-user", (req, res) => {
    res.render("admin/register-user")
})

router.post("/registering-user", (req, res) => {
    let errors = []

    if(!req.body.name || typeof !req.body.name == undefined || req.body.name == null) {
        errors.push({text: "Nome inválido"})
    }

    if(!req.body.email || typeof !req.body.email == undefined || req.body.email == null) {
        errors.push({text: "E-mail inválido"})
    }

    if(req.body.password.length < 4) {
        errors.push({text: "Senha muito curta"})
    }

    if(req.body.password != req.body.password2) {
        errors.push({text: "As senhas não são iguais"})
    }

    if(errors.length > 0) {
        res.render("admin/register-user", {errors: errors})
    }else {
        User.findOne({email: req.body.email}).then((user) => {
            if(user) {
                req.flash("error_msg", "E-mail já cadastrado")
                res.redirect("/admin/register-user")
            } else{
                const email = req.body.email.toLowerCase()
                const newUser = new User({
                    name:  req.body.name,
                    email,
                    password: req.body.password
                })

                //criptografar senha
                bcrypt.genSalt(10, (error, salt) => {
                    bcrypt.hash(newUser.password, salt, (error, hash) => {
                        if(error){
                            req.flash("error_msg", "Houve um erro durante o registro do usuário")
                            res.redirect("/admin")
                        } 

                        newUser.password = hash

                        newUser.save().then(() => {
                            req.flash("success_msg", "Usuário registrado com sucesso")
                            res.redirect("/admin/consult-users")
                        }).catch(() => {
                            req.flash("error_msg", "Houve um erro ao registrar o usário")
                            res.redirect("/admin")
                        })
                    })
                })
            }
        }).catch((err) => {
            req.flash("error_msg", `Houve um erro interno: ${err}`)
            res.redirect("/admin/consult-users")
        })
    }
})

router.get('/consult-users', (req, res) => {
    User.find().sort({createdAt: 'DESC'}).then((users) => {
        res.render('admin/consult-users', {users: users})
    }).catch((err) => {
        req.flash('error_msg', `Houve um erro ao listar os usuários ${err}`)
        res.redirect('/admin')
    })
})

router.get('/edit-user/:id', (req, res) => {
    User.findOne({_id: req.params.id}).then((user) => {
        res.render('admin/edit-user', {user: user})
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao carregar o usuário a ser editado')
        res.redirect('/admin/consult-users')
    })
})

router.post('/editing-user', (req, res) => {
    User.findOne({_id: req.body.id}).then((user) => {
        user.name = req.body.name
        user.email = req.body.email
        user.password = req.body.password
        user.password2 = req.body.password2
        
        let errors = []

        if(user.password != user.password2) {
            errors.push({text: 'As senhas digitadas não coincidem'})
        }

        if(errors.length > 0) {
            res.render('admin/edit-user', {errors: errors, user: user})
        } else {
            bcrypt.genSalt(10, (error, salt) => {
                bcrypt.hash(user.password, salt, (err, hash) => {
                    if(err){
                        req.flash("error_msg", `Houve um erro durante o registro do usuário: ${err}`)
                        res.redirect("/admin")
                    } 
    
                    user.password = hash
    
                    user.save().then(() => {
                        req.flash("success_msg", "Usuário registrado com sucesso")
                        res.redirect('/admin/consult-users')
                    }).catch((err) => {
                        req.flash("error_msg", `Houve um erro ao registrar o seu usuário: ${err}` )
                        res.redirect('/admin')
                    })
                })
            })
        }
  
    }).catch((err) => {
            req.flash('error_msg', `Não foi possível encontrar esse usuário: ${err}` )
            res.redirect('/admin/consult-users')
    })
})

router.get('/delete-user/:id', (req, res) => {
    User.findByIdAndDelete({_id: req.params.id}).then(() => {
        req.flash('success_msg', 'Cadastro do usuário excluído com sucesso')
        res.redirect('/admin/consult-users')
    }).catch((err) => {
        req.flash('error_msg', `Ocorreu um erro: ${err}`)
        res.render('admin/consult-users')
    })
})

module.exports = router