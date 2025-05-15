import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: false,
        resources: {
            en: {
                translation: {
                    home: 'Home',
                    toys: 'Toys',
                    dashboard: 'Dashboard',
                    about: 'About',
                    mister_toy: 'Mister Toy',
                    online: 'Online',
                    disconnected: 'Disconnected',
                    i18: 'internationalization',
                },
            },
            es: {
                translation: {
                    home: 'Inicio',
                    toys: 'Juguetes',
                    dashboard: 'Tablero',
                    about: 'Acerca de',
                    mister_toy: 'Señor Juguete',
                    online: 'En línea',
                    disconnected: 'Desconectado',
                    i18: 'internacionalización',
                },
            },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already does escaping
        },
    })

export default i18n
