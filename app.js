const express = require('express')
const cors = require('cors')
const app = express()
const session = require("express-session")

const moment = require('moment')

const handlebars = require('express-handlebars')
const handle = handlebars.create({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
    helpers: {
        formatDate: (date) => {
            const dataBanco = new Date(date)
            const dataFormatada = dataBanco.toLocaleString()
            return dataFormatada
        },
        pagination: (page, totalPages, limit, sort) => {
            let output = '';

            const pageNUM = parseInt(page);

            // Adiciona link para a primeira página
            if (pageNUM > 1) {
                output += `
                    <a class="btn btn-secondary" href="/admin?sort=${sort}&limit=${limit}&page=1">&laquo;</a>
                `;
            }

            // Adiciona link para a página anterior
            if (pageNUM > 1) {
                output += `
                    <a class="btn btn-secondary" href="/admin?sort=${sort}&limit=${limit}&page=${pageNUM - 1}">&lsaquo;</a>
                `;
            }

            // Adiciona links para páginas específicas (5 páginas no máximo)
            for (let i = Math.max(1, pageNUM - 2); i <= Math.min(totalPages, pageNUM + 2); i++) {
                const activeClass = i === pageNUM ? 'btn-success' : 'btn-secondary';

                output += `
                    <a class="btn ${activeClass}" href="/admin?sort=${sort}&limit=${limit}&page=${i}">${i}</a>
                `;
            }

            // Adiciona link para a próxima página
            if (pageNUM < totalPages) {
                output += `
                    <a class="btn btn-secondary" href="/admin?sort=${sort}&limit=${limit}&page=${pageNUM + 1}">&rsaquo;</a>
                `;
            }

            // Adiciona link para a última página
            if (pageNUM < totalPages) {
                output += `
                    <a class="btn btn-secondary" href="/admin?sort=${sort}&limit=${limit}&page=${totalPages}">&raquo;</a>
                `;
            }

            return output;
        },
        verifyCodPassport: (codPassport, residentUSCIS, airplane, canadaVisa, nonImmigrateVisa) => {
            const specialCodes = ['ATG (Antígua e Barbuda)', 'BRA (Brasil)']
            let output = ""

            if (specialCodes.includes(codPassport)) {
                residentUSCIS ? output += `<p class="mb-2">Você é um residente permanente legal dos Estados Unidos com um número válido dos Serviços de Cidadania e Imigração dos EUA (USCIS)?</p><p class="d-inline-block alert-success p-1 mb-3">Sim</p>` : output += `<p class="mb-2">Você é um residente permanente legal dos Estados Unidos com um número válido dos Serviços de Cidadania e Imigração dos EUA (USCIS)?</p><p class="d-inline-block alert-danger p-1 mb-3">Não</p>`
                
                airplane ? output += `<p class="mb-2">Você está viajando para o Canadá de avião?</p><p class="d-inline-block alert-success p-1 mb-3">Sim</p>` : output += `<p class="mb-2">Você está viajando para o Canadá de avião?</p><p class="d-inline-block alert-danger p-1 mb-3">Não</p>`

                canadaVisa ? output += `<p class="mb-2">Nos últimos 10 anos, você possuiu um visto canadiano de residente temporário válido?</p><p class="d-inline-block alert-success p-1 mb-3">Sim</p>` : output += `<p class="mb-2">Nos últimos 10 anos, você possuiu um visto canadiano de residente temporário válido?</p><p class="d-inline-block alert-danger p-1 mb-3">Não</p>`

                nonImmigrateVisa ? output += `<p class="mb-2">Você atualmente possui um visto válido de não-imigrante nos EUA?</p><p class="d-inline-block alert-success p-1 mb-3">Sim</p>` : output += `<p class="mb-2">Você atualmente possui um visto válido de não-imigrante nos EUA?</p><p class="d-inline-block alert-danger p-1 mb-3">Não</p>`
            
            }

            return output
        },
        verifyCodPassportStep: (codPassport, residentUSCIS, airplane, canadaVisa, nonImmigrateVisa) => {
            const specialCodes = ['ATG (Antígua e Barbuda)', 'BRA (Brasil)']
            let output = ""

            if (specialCodes.includes(codPassport)) {
                residentUSCIS ? 
                    output += `
                        <label class="mt-3">Você é um residente permanente legal dos Estados Unidos com um número válido dos Serviços de Cidadania e Imigração dos EUA (USCIS)?</label> 
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="residentUSCIS" id="residentUSCIS1" value="0" disabled required>
                                <label class="form-check-label" for="residentUSCIS1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="residentUSCIS" id="residentUSCIS2" value="1" checked required>
                                <label class="form-check-label" for="residentUSCIS2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    ` : 
                    output += `
                        <label class="mt-3">Você é um residente permanente legal dos Estados Unidos com um número válido dos Serviços de Cidadania e Imigração dos EUA (USCIS)?</label> 
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="residentUSCIS" id="residentUSCIS1" value="0" checked required>
                                <label class="form-check-label" for="residentUSCIS1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="residentUSCIS" id="residentUSCIS2" value="1" disabled required>
                                <label class="form-check-label" for="residentUSCIS2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    `
                
                airplane ?
                    output += `
                        <label class="mt-3">Você está viajando para o Canadá de avião?</label>
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="airplane" id="airplane1" value="0" disabled required>
                                <label class="form-check-label" for="airplane1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="airplane" id="airplane2" value="1" checked required>
                                <label class="form-check-label" for="airplane2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    ` :
                    output += `
                        <label class="mt-3">Você está viajando para o Canadá de avião?</label>
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="airplane" id="airplane1" value="0" checked required>
                                <label class="form-check-label" for="airplane1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="airplane" id="airplane2" value="1" disabled required>
                                <label class="form-check-label" for="airplane2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    `

                canadaVisa ? 
                    output += `
                        <label class="mt-3">Nos últimos 10 anos, você possuiu um visto canadiano de residente temporário válido?</label>
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="canadaVisa" id="canadaVisa1" value="0" disabled required>
                                <label class="form-check-label" for="canadaVisa1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="canadaVisa" id="canadaVisa2" value="1" checked required>
                                <label class="form-check-label" for="canadaVisa2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    ` :
                    output += `
                        <label class="mt-3">Nos últimos 10 anos, você possuiu um visto canadiano de residente temporário válido?</label>
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="canadaVisa" id="canadaVisa1" value="0" checked required>
                                <label class="form-check-label" for="canadaVisa1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="canadaVisa" id="canadaVisa2" value="1" disabled required>
                                <label class="form-check-label" for="canadaVisa2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    `

                nonImmigrateVisa ?
                    output += `
                        <label class="mt-3">Você atualmente possui um visto válido de não-imigrante nos EUA?</label>
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="nonImmigrateVisa" id="nonImmigrateVisa1" value="0" disabled required>
                                <label class="form-check-label" for="nonImmigrateVisa1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="nonImmigrateVisa" id="nonImmigrateVisa2" value="1" checked required>
                                <label class="form-check-label" for="nonImmigrateVisa2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    ` :
                    output += `
                        <label class="mt-3">Você atualmente possui um visto válido de não-imigrante nos EUA?</label>
                        <div class="p-2 w-50 d-flex flex-row gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="nonImmigrateVisa" id="nonImmigrateVisa1" value="0" checked required>
                                <label class="form-check-label" for="nonImmigrateVisa1">
                                    Não
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="nonImmigrateVisa" id="nonImmigrateVisa2" value="1" disabled required>
                                <label class="form-check-label" for="nonImmigrateVisa2">
                                    Sim
                                </label>
                            </div>
                        </div>
                    `
            }

            return output
        },
        formatTransactionAmount: (value) => {
            return value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        },
        formatStatusPayment: (status) => {
            switch (status) {
                case 'succeeded':
                    return '<span class="alert-success p-1">Aprovado</span>'
                    break
    
                case 'processing':
                    return '<span class="alert-warning p-1">Processando</span>'
                    break
                
                case 'Checkout em andamento':
                return '<span class="alert-warning p-1">Checkout em andamento</span>'
                break
    
                case 'requires_payment_method':
                    return '<span class="alert-danger p-1">Recusado</span>'
                    break
            }
        }
    }
})

const bodyParser = require('body-parser')

const mongoose = require('mongoose')
require('./models/Visa')
const Visa = mongoose.model("visa")
require('./models/User')
const User = mongoose.model("users")

const nodemailer = require('nodemailer')
const { transporter, handlebarOptions } = require('./helpers/senderMail')
const hbs = require('nodemailer-express-handlebars')

const admin = require('./routes/admin')
const users = require('./routes/users')
const checkout = require('./routes/checkout')

const flash = require("connect-flash")

const path = require('path')

const dotenv = require('dotenv')
require('dotenv').config()

const bcrypt = require('bcryptjs')

const cookieParser = require('cookie-parser')

// const cron = require('node-cron')

// cron.schedule('*/1 * * * *', () =>  {
//         console.log('task rodando')
//     }
// )


/*AUTHENTICATION*/
const passport = require("passport")
require("./config/auth")(passport)
const { isAdmin } = require('./helpers/isAdmin')


/*SETTINGS*/
app.use(cors({
    origin: 'https://etacanadiano.pt'
}))
app.use(express.static(path.join(__dirname, "public")))
app.use(session({
    secret: process.env.CANADIANO_SECRET,
    resave: true,
    saveUninitialized: true
}))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

//Handlerbars
app.engine('handlebars', handle.engine)
app.set('view engine', 'handlebars')

//Body Parser
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

//Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null
    next()
})
app.use(cookieParser())

app.use((req, res, next) => {
    if (!req.session.aplicacaoStep) {
      req.session.aplicacaoStep = {} // Inicialize o objeto aplicacaoStep
    }
    next()
})

//Mongoose
mongoose.set('strictQuery', true)
mongoose.connect(process.env.CANADIANO_DB_STRING_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log({
        date: new Date(),
        message: "MONGODB ON"
    })
}).catch((err) => {
    console.log(`Erro: ${err}`)
})

app.post('/accept-policy', (req, res, next) => {
    //Setar cookie de aceite de política por 1 ano
    res.cookie('policyAccepted', true, { maxAge: 31536000000 })
    res.status(200).json({ message: 'Cookies aceitos com sucesso!' })
})

app.get('/', (req, res) => {
    req.session.destroy()
    const policyAccepted = req.cookies.policyAccepted
    const showPolicyPopup = !policyAccepted
    const metaDescription = "Garanta sua entrada no Canadá de forma descomplicada e segura com o eTA (Autorização Eletrônica de Viagem). Nosso processo de solicitação online simplifica sua jornada. Solicite seu eTA agora e aproveite uma viagem tranquila ao Canadá" 
    res.render('index', {showPolicyPopup, metaDescription})
})

app.get('/aplicacao', (req, res) => {
    const policyAccepted = req.cookies.policyAccepted
    const showPolicyPopup = !policyAccepted
    if(!parseInt(req.query.etapa)) {
        const title = "Representante - "
        const metaDescription = 'Inicie o processo de solicitação de Autorização Eletrônica de Viagem para o Canadá. Siga nosso guia passo a passo para obter acesso rápido e fácil a este destino deslumbrante'
        if(req.query.again === "true") {
            req.session.aplicacaoStep = {}
            res.render('aplicacao-step1', { showPolicyPopup, title, data: req.session.aplicacaoStep, metaDescription })
        } else {
            req.session.payment_id ? req.session.payment_id = "" : null
            req.session.client_secret ? req.session.client_secret = "" : null
            req.session.visas ? req.session.visas.ids = [] : null
            res.render('aplicacao-step1', { showPolicyPopup, title, data: req.session.aplicacaoStep, metaDescription })
        }
    }

    if(parseInt(req.query.etapa) === 2) {
        const sessionaData = req.session.aplicacaoStep
        if('representative' in sessionaData ) {
            const title = "Validação - "
            res.render('aplicacao-step2', { title, data: req.session.aplicacaoStep })
        } else {
            req.flash('error_msg', 'Os campos na etapa 1 devem ser preenchidos.')
            res.redirect(`/aplicacao`)
        }

    }

    if(parseInt(req.query.etapa) === 3) {
        const sessionaData = req.session.aplicacaoStep
        if('document' in sessionaData) {
            const title = "Documentos - "
            const { canadaVisa, nonImmigrateVisa } = req.session.aplicacaoStep
            if ((canadaVisa == "0" && nonImmigrateVisa == "1") || (canadaVisa == "1" && nonImmigrateVisa == "1")) {
                let dynamicData = `
                    <h3 class="mt-4">Dados de não-imigrante</h3>

                    <label class="mb-2">Número do visto de não imigrante nos EUA <span class="text-red">* (obrigatório)</span></label>
                    <span class="d-block small mb-2">
                        Confira no botão ao lado
                        <a type="button" data-bs-toggle="modal" data-bs-target="#documentModalNumVisaNonImmigrate">
                            <i class="bi bi-question-circle-fill btn p-0"></i>
                        </a>
                    </span>
                    <input type="text" class="form-control mb-3 w-50" name="numVisaNonImmigrate" id="numVisaNonImmigrate" maxlength="9" required>

                    <label class="mb-2" for="dateVisaNonImmigrate">Data de expiração do visto americano de não-imigrante <span class="text-red">* (obrigatório)</span></label>
                    <input type="date" class="form-control mb-3 w-25" name="dateVisaNonImmigrate" id="dateVisaNonImmigrate" onblur="validNotPresentDay(this)" required>   
                `
                res.render('aplicacao-step3', {title, dynamicData, data: req.session.aplicacaoStep})
            } else {
                res.render('aplicacao-step3', {title, dynamicData: '', data: req.session.aplicacaoStep})
            }
        } else {
            req.flash('error_msg', 'Os campos na etapa 2 devem ser preenchidos.')
            res.redirect(`/aplicacao?etapa=2`)
        }
        
    }

    if(parseInt(req.query.etapa) === 4) {
        const sessionaData = req.session.aplicacaoStep
        if('numPassport' in sessionaData) {
            const title = "Conferência - "
            res.render('aplicacao-step4', {title, data: req.session.aplicacaoStep})
        } else {
            req.flash('error_msg', 'Os campos na etapa 3 devem ser preenchidos.')
            res.redirect(`/aplicacao?etapa=3`)
        }
    }

})

app.post('/aplicacaoStep1', (req, res) => {
    req.session.aplicacaoStep = Object.assign({}, req.body)

    req.session.aplicacaoStep.representative = parseInt(req.session.aplicacaoStep.representative)
    req.session.aplicacaoStep.representative ? req.session.aplicacaoStep.representativePayed = parseInt(req.session.aplicacaoStep.representativePayed) : 0

    res.redirect('/aplicacao?etapa=2')
})

app.post('/aplicacaoStep2', (req, res) => {
    req.session.aplicacaoStep = Object.assign({}, req.session.aplicacaoStep, req.body)

    req.session.aplicacaoStep.residentUSCIS = parseInt(req.session.aplicacaoStep.residentUSCIS)
    req.session.aplicacaoStep.airplane = parseInt(req.session.aplicacaoStep.airplane)
    req.session.aplicacaoStep.canadaVisa = parseInt(req.session.aplicacaoStep.canadaVisa)
    req.session.aplicacaoStep.nonImmigrateVisa = parseInt(req.session.aplicacaoStep.nonImmigrateVisa)

    res.redirect('/aplicacao?etapa=3')
})

app.post('/aplicacaoStep3', (req, res) => {
    req.session.aplicacaoStep = Object.assign({}, req.session.aplicacaoStep, req.body)

    req.session.aplicacaoStep.appliedToCanada = parseInt(req.session.aplicacaoStep.appliedToCanada)
    req.session.aplicacaoStep.travelWhen = parseInt(req.session.aplicacaoStep.travelWhen)
    req.session.aplicacaoStep.refusedVisaToCanda = parseInt(req.session.aplicacaoStep.refusedVisaToCanda)
    req.session.aplicacaoStep.criminalOffenceAnywhere = parseInt(req.session.aplicacaoStep.criminalOffenceAnywhere)
    req.session.aplicacaoStep.tuberculosis = parseInt(req.session.aplicacaoStep.tuberculosis)

    res.redirect('/aplicacao?etapa=4')
})

app.post('/aplicacaoStep4', async (req, res) => {
    bcrypt.genSalt(10, (error, salt) => {
        let code = ''
        bcrypt.hash(code, salt, (error, hash) => {
            let codeETA = ''
            code = hash
            codeETA = code.substring(40, 45).replace(/[^A-Z a-z 0-9]/g, "X").toUpperCase()

            const agreeCheck = req.body.agreeCheck
            const consentAndDeclaration = req.body.consentAndDeclaration

            const newVisa = new Visa(Object.assign({}, req.session.aplicacaoStep, {agreeCheck, consentAndDeclaration, codeETA}))

            const visaID = newVisa._id

            let sessionIDs

            if (req.session.visas && req.session.visas.ids) {
                sessionIDs = req.session.visas.ids
                sessionIDs.push(visaID)
            } else {
                sessionIDs = [visaID]
                req.session.visas = { ids: sessionIDs }
            }
            req.session.aplicacaoStep = Object.assign({}, {visaID}, req.session.aplicacaoStep, {agreeCheck, consentAndDeclaration, codeETA})

            if (req.session.aplicacoes) {
                const aplicacoes = req.session.aplicacoes
                aplicacoes.push(req.session.aplicacaoStep)
            } else {
                req.session.aplicacoes = [req.session.aplicacaoStep]
            }

            newVisa.save().then(() => {
                req.flash('success_msg', `Seus dados foram salvos com sucesso. Código: ${codeETA}`)
                res.redirect('/checkout')
                
            }).catch((err) => {
                console.log(err)
                req.flash('error_msg', 'Ocorreu um erro no processamento dos seus dados. Preencha o formulário novamente. Erro: ' + err)
                res.redirect('/aplicacao')
                req.session.destroy()
            })
        })      
    })
})

app.get('/acompanhar-solicitacao', (req, res) => {
    const policyAccepted = req.cookies.policyAccepted
    const showPolicyPopup = !policyAccepted
    res.render('acompanhar-solicitacao', {
        showPolicyPopup,
        title: 'Acompanhar solicitação - ',
        metaDescription: 'Acompanhe o status de sua solicitação de eTA em tempo real. Fique atualizado sobre o progresso e a aprovação de sua Autorização Eletrônica de Viagem para o Canadá.'
    })
})

app.post('/consultando-solicitacao', (req, res) => {
    if(req.body.codeInsert === undefined || req.body.codeInsert === null || req.body.codeInsert === '') {
        req.flash('error_msg', 'Insira um e-mail ou código')
        res.redirect('/acompanhar-solicitacao')
    } else {
        if (req.body.EmailCod === 'email') {
            Visa.find({contactEmail: req.body.codeInsert}).populate('pagamento').then((search_result) => {
                res.render('status-solicitacao', { search_result })
            })
        } else {
            Visa.find({codeETA: req.body.codeInsert}).populate('pagamento').then((search_result) => {
                res.render('status-solicitacao', { search_result })
            })
        }
        
    }
})

app.get('/consulta-download-documento/:filename', (req, res) => {
    res.download(`public/uploads/attachments/${req.params.filename}`)
})

app.get('/contacto', (req, res) => {
    const policyAccepted = req.cookies.policyAccepted
    const showPolicyPopup = !policyAccepted
    res.render('contacto', {
        showPolicyPopup,
        title: 'Contacto - ',
        metaDescription: 'Entre em contato conosco para todas as suas dúvidas e necessidades relacionadas à Autorização Eletrônica de Viagem para o Canadá. Estamos aqui para ajudar a tornar sua viagem o mais tranquila possível.'
    })
})

app.post('/contact-form', (req, res) => {
    transporter.use('compile', hbs(handlebarOptions))

    const mailOptions = {
        from: `eTA Canadiano <${process.env.CANADIANO_SENDER_MAIL}>`,
        to: process.env.MAIL_RECEIPT,
        subject: 'Formulário de Contacto',
        template: 'contacto',
        context: {
            name: req.body.name,
            email: req.body.email,
            message: req.body.message
        }
    }

    transporter.sendMail(mailOptions, (err, {response, envelope, messageId}) => {
        if(err) {
            console.error("Formulário de contacto: " + new Date())
            console.error(err)
            req.flash('error_msg', `Houve um erro ao enviar este formulário: ${err}`)
            res.redirect('/contacto')
        } else {
            console.log("Formulário de contacto: " + new Date())
            console.log({response, envelope, messageId})
            req.flash('success_msg', `Formulário enviado com sucesso. Em breve a nossa equipa entrará em contacto.`)
            res.redirect('/contacto')
        }
    })
})

app.get('/artigos', (req, res) => {
    const policyAccepted = req.cookies.policyAccepted
    const showPolicyPopup = !policyAccepted
    res.render('artigos', {
        showPolicyPopup,
        title: 'Artigos - ',
        metaDescription: 'Explore nosso catálogo de artigos informativos sobre viagens ao Canadá, Autorização Eletrônica de Viagem e dicas úteis para uma visita perfeita.'
    })
})

app.get('/politica-privacidade', (req, res) => {
    const policyAccepted = req.cookies.policyAccepted
    const showPolicyPopup = !policyAccepted
    res.render('politica-privacidade', {
        showPolicyPopup,
        title: 'Politica de privacidade - ',
        metaDescription: 'Saiba como protegemos seus dados pessoais. Leia nossa Política de Privacidade para entender nosso compromisso com a segurança e a confidencialidade.'
    })
})

app.get('/termos-condicoes', (req, res) => {
    const policyAccepted = req.cookies.policyAccepted
    const showPolicyPopup = !policyAccepted
    res.render('termos-condicoes', {
        showPolicyPopup,
        title: 'Termos e Condições - ',
        metaDescription: 'Conheça nossos Termos e Condições para solicitação e uso da Autorização Eletrônica de Viagem para o Canadá. Garanta que sua viagem esteja em conformidade com as regras e regulamentos'
    })
})

app.use('/admin', isAdmin, admin)
app.use('/users', users)
app.use('/checkout', checkout)

app.use((req, res) => {
    res.status(404).render("erro404", {title: "Error 404 - "})
})

const PORT = process.env.PORT || 3040
app.listen(PORT, ()=> {
    console.log({
        date: new Date(),
        message: `SERVER ON PORT: ${PORT}`
    })
})
