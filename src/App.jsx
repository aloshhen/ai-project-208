import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// SAFE ICON COMPONENT
// ============================================
const SafeIcon = ({ name, size = 24, className, color }: { name: string; size?: number; className?: string; color?: string }) => {
  const [IconComponent, setIconComponent] = useState<any>(null)
  
  useEffect(() => {
    import('lucide-react').then((icons) => {
      const pascalCaseName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
      const Icon = (icons as any)[pascalCaseName] || icons.HelpCircle
      setIconComponent(() => Icon)
    })
  }, [name])
  
  if (!IconComponent) return <div style={{ width: size, height: size }} className={className} />
  
  return <IconComponent size={size} className={className} color={color} />
}

// ============================================
// WEB3FORMS HOOK
// ============================================
const useFormHandler = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, accessKey: string) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsError(false)
    
    const formData = new FormData(e.target as HTMLFormElement)
    formData.append('access_key', accessKey)
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        ;(e.target as HTMLFormElement).reset()
      } else {
        setIsError(true)
        setErrorMessage(data.message || 'Что-то пошло не так')
      }
    } catch (error) {
      setIsError(true)
      setErrorMessage('Ошибка сети. Попробуйте снова.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const resetForm = () => {
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage('')
  }
  
  return { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm }
}

// ============================================
// CLEAN MAP COMPONENT
// ============================================
const CleanMap = ({ coordinates = [14.4378, 50.0755], zoom = 15, markers = [] }: { coordinates?: number[]; zoom?: number; markers?: Array<{lng: number; lat: number; title: string}> }) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: coordinates,
      zoom: zoom,
      attributionControl: false,
      interactive: true,
      dragPan: true,
      dragRotate: false,
      touchZoomRotate: false,
      doubleClickZoom: true,
      keyboard: false
    })

    map.current.scrollZoom.disable()

    const el = document.createElement('div')
    el.style.cssText = `
      width: 32px;
      height: 32px;
      background: #f59e0b;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      cursor: pointer;
    `
    
    new maplibregl.Marker({ element: el })
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<strong style="color: #0f172a;">BAZA Barbershop</strong><br/>Praha'))
      .addTo(map.current)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [coordinates, zoom, markers])

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20 relative">
      <style>{`
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-logo { display: none !important; }
        .maplibregl-compact { display: none !important; }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  )
}

// ============================================
// CHAT WIDGET COMPONENT
// ============================================
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{text: string; isUser: boolean}>>([
    { text: 'Привет! Чем могу помочь?', isUser: false }
  ])
  const [inputValue, setInputValue] = useState('')
  
  const FAQ_DATA = [
    {
      question: 'Как записаться?',
      answer: 'Вы можете записаться через форму на сайте, по телефону +420 123 456 789 или в Instagram @baza.barbershop',
      keywords: ['запись', 'записаться', 'как записаться', 'онлайн']
    },
    {
      question: 'Сколько стоит стрижка?',
      answer: 'Мужская стрижка от 600 CZK, борода от 400 CZK, комплекс от 900 CZK. Полный прайс в разделе Цены.',
      keywords: ['цена', 'стоимость', 'сколько', 'прайс', 'цены']
    },
    {
      question: 'Где вы находитесь?',
      answer: 'Мы в Праге, район Vinohrady. Точный адрес: Náměstí Míru 15. Работаем ежедневно с 9:00 до 21:00.',
      keywords: ['адрес', 'где', 'локация', 'место', 'прага']
    },
    {
      question: 'Нужна ли предоплата?',
      answer: 'Нет, предоплата не требуется. Но просим предупреждать об отмене минимум за 2 часа.',
      keywords: ['предоплата', 'оплата', 'залог']
    }
  ]
  
  const handleSend = () => {
    if (!inputValue.trim()) return
    
    const userMessage = inputValue.trim().toLowerCase()
    setMessages(prev => [...prev, { text: inputValue, isUser: true }])
    setInputValue('')
    
    // Check FAQ
    const match = FAQ_DATA.find(faq => 
      faq.keywords.some(keyword => userMessage.includes(keyword))
    )
    
    setTimeout(() => {
      if (match) {
        setMessages(prev => [...prev, { text: match.answer, isUser: false }])
      } else {
        setMessages(prev => [...prev, { 
          text: 'Извините, я не понял вопрос. Попробуйте спросить про запись, цены или адрес. Или позвоните нам: +420 123 456 789', 
          isUser: false 
        }])
      }
    }, 500)
  }
  
  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gold-500 hover:bg-gold-600 text-slate-950 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <SafeIcon name={isOpen ? 'x' : 'message-square'} size={24} />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-slate-900 rounded-2xl shadow-2xl border border-gold-500/30 overflow-hidden"
          >
            <div className="bg-gold-500 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center">
                <SafeIcon name="bot" size={20} className="text-gold-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950">BAZA Assistant</h3>
                <p className="text-xs text-slate-800">Обычно отвечает мгновенно</p>
              </div>
            </div>
            
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.isUser 
                      ? 'bg-gold-500 text-slate-950 rounded-br-none' 
                      : 'bg-slate-800 text-gray-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
              <button 
                onClick={handleSend}
                className="bg-gold-500 hover:bg-gold-600 text-slate-950 p-2 rounded-lg transition-colors"
              >
                <SafeIcon name="send" size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// ANIMATED SECTION COMPONENT
// ============================================
const AnimatedSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isSubmitting, isSuccess, isError, errorMessage, handleSubmit, resetForm } = useFormHandler()
  const ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY' // Replace with your Web3Forms Access Key
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }
  
  const services = [
    { icon: 'scissors', title: 'Мужская стрижка', price: '600 CZK', desc: 'Классическая или модельная стрижка с мытьём головы' },
    { icon: 'razor', title: 'Стрижка бороды', price: '400 CZK', desc: 'Формирование контура и подравнивание бороды' },
    { icon: 'flame', title: 'Королевское бритьё', price: '500 CZK', desc: 'Бритьё опасной бритвой с горячими полотенцами' },
    { icon: 'sparkles', title: 'Комплекс', price: '900 CZK', desc: 'Стрижка + борода + уход за кожей' },
    { icon: 'crown', title: 'Отец + Сын', price: '1000 CZK', desc: 'Стрижка для папы и ребёнка (до 12 лет)' },
    { icon: 'droplets', title: 'Уход за кожей', price: '300 CZK', desc: 'Чистка лица, маска, увлажнение' },
  ]
  
  const testimonials = [
    { name: 'Александр', text: 'Лучший барбершоп в Праге! Атмосфера, музыка, профессионализм — всё на высоте.', rating: 5 },
    { name: 'Михаил', text: 'Хожу в BAZA уже полгода. Мастера знают своё дело, всегда доволен результатом.', rating: 5 },
    { name: 'Дмитрий', text: 'Наконец-то нашёл своего барбера! Цены адекватные, сервис отличный.', rating: 5 },
    { name: 'Иван', text: 'Приятная атмосфера, вкусный кофе, отличная стрижка. Рекомендую!', rating: 5 },
  ]
  
  const galleryImages = [
    'https://images.unsplash.com/photo-1599351431202-6e0c46593bff?w=600&q=80',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80',
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80',
  ]

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Background noise texture */}
      <div className="fixed inset-0 bg-noise pointer-events-none z-0" />
      
      {/* HEADER */}
      <header className="fixed top-0 w-full bg-slate-950/90 backdrop-blur-xl z-40 border-b border-gold-500/20">
        <nav className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="font-display text-2xl text-slate-950">B</span>
            </div>
            <span className="font-display text-3xl text-white tracking-wider">BAZA</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['about', 'services', 'prices', 'gallery', 'reviews', 'faq', 'contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-gray-300 hover:text-gold-400 transition-colors text-sm font-medium uppercase tracking-wider"
              >
                {item === 'about' && 'О нас'}
                {item === 'services' && 'Услуги'}
                {item === 'prices' && 'Цены'}
                {item === 'gallery' && 'Галерея'}
                {item === 'reviews' && 'Отзывы'}
                {item === 'faq' && 'FAQ'}
                {item === 'contact' && 'Контакты'}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => scrollToSection('booking')}
            className="hidden md:flex bg-gold-500 hover:bg-gold-600 text-slate-950 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 items-center gap-2"
          >
            <SafeIcon name="calendar" size={18} />
            Записаться
          </button>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-white"
          >
            <SafeIcon name={isMenuOpen ? 'x' : 'menu'} size={24} />
          </button>
        </nav>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-900 border-t border-gold-500/20 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {['about', 'services', 'prices', 'gallery', 'reviews', 'faq', 'contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="block w-full text-left text-gray-300 hover:text-gold-400 py-2 transition-colors uppercase tracking-wider text-sm"
                  >
                    {item === 'about' && 'О нас'}
                    {item === 'services' && 'Услуги'}
                    {item === 'prices' && 'Цены'}
                    {item === 'gallery' && 'Галерея'}
                    {item === 'reviews' && 'Отзывы'}
                    {item === 'faq' && 'FAQ'}
                    {item === 'contact' && 'Контакты'}
                  </button>
                ))}
                <button 
                  onClick={() => scrollToSection('booking')}
                  className="w-full bg-gold-500 text-slate-950 py-3 rounded-lg font-bold mt-4"
                >
                  Записаться онлайн
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80" 
            alt="Barbershop interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/30 rounded-full px-4 py-2 mb-6">
              <SafeIcon name="map-pin" size={16} className="text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">Praha, Vinohrady</span>
            </div>
            
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-white mb-4 tracking-tight">
              BAZA <span className="text-gradient">BARBERSHOP</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto font-light">
              Твоё новое качество. Где стиль встречается с характером.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => scrollToSection('booking')}
                className="bg-gold-500 hover:bg-gold-600 text-slate-950 px-8 py-4 rounded-lg text-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/25"
              >
                <SafeIcon name="scissors" size={20} />
                Записаться сейчас
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all"
              >
                Наши услуги
              </button>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl text-gold-400">5+</div>
              <div className="text-gray-400 text-sm mt-1">Лет опыта</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl text-gold-400">5000+</div>
              <div className="text-gray-400 text-sm mt-1">Клиентов</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl text-gold-400">6</div>
              <div className="text-gray-400 text-sm mt-1">Мастеров</div>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400"
        >
          <SafeIcon name="chevron-down" size={32} />
        </motion.div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="relative">
                <div className="absolute -inset-4 bg-gold-500/20 rounded-3xl blur-3xl" />
                <img 
                  src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80" 
                  alt="Barber at work" 
                  className="relative rounded-2xl shadow-2xl w-full"
                />
                <div className="absolute -bottom-6 -right-6 bg-gold-500 p-6 rounded-2xl shadow-xl">
                  <div className="font-display text-4xl text-slate-950">5</div>
                  <div className="text-slate-800 text-sm font-medium">лет<br/>опыта</div>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
                <SafeIcon name="info" size={16} />
                О нас
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
                МЕСТО, ГДЕ <span className="text-gradient">СОЗДАЁТСЯ СТИЛЬ</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                BAZA — это не просто барбершоп. Это пространство, где каждый мужчина может расслабиться, 
                выпить виски или кофе, и получить идеальную стрижку от профессионалов.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Мы находимся в самом сердце Праги, в районе Vinohrady. Наша команда — это мастера 
                с опытом работы в лучших барбершопах Европы. Мы знаем, как подчеркнуть вашу индивидуальность.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="award" size={24} className="text-gold-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Премиум качество</h4>
                    <p className="text-gray-500 text-sm">Только лучшие инструменты и косметика</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SafeIcon name="clock" size={24} className="text-gold-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Без очередей</h4>
                    <p className="text-gray-500 text-sm">Только по записи, строго вовремя</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-20 md:py-32 bg-slate-900/50">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
              <SafeIcon name="scissors" size={16} />
              Услуги
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white">
              ЧТО МЫ <span className="text-gradient">ПРЕДЛАГАЕМ</span>
            </h2>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="group bg-slate-950 border border-slate-800 hover:border-gold-500/50 rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-gold-500/10">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold-500/20 transition-colors">
                    <SafeIcon name={service.icon} size={32} className="text-gold-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-gray-400 mb-4 text-sm">{service.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gold-400 font-display text-2xl">{service.price}</span>
                    <button 
                      onClick={() => scrollToSection('booking')}
                      className="text-gray-400 hover:text-gold-400 transition-colors"
                    >
                      <SafeIcon name="arrow-right" size={20} />
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* PRICES SECTION */}
      <section id="prices" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
              <SafeIcon name="banknote" size={16} />
              Прайс-лист
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white">
              ПРОЗРАЧНЫЕ <span className="text-gradient">ЦЕНЫ</span>
            </h2>
          </AnimatedSection>
          
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-slate-800">
                {[
                  { name: 'Мужская стрижка', price: '600 CZK', time: '45 мин' },
                  { name: 'Стрижка бороды', price: '400 CZK', time: '30 мин' },
                  { name: 'Королевское бритьё', price: '500 CZK', time: '40 мин' },
                  { name: 'Комплекс (стрижка + борода)', price: '900 CZK', time: '75 мин' },
                  { name: 'Отец + Сын', price: '1000 CZK', time: '90 мин' },
                  { name: 'Уход за кожей лица', price: '300 CZK', time: '20 мин' },
                  { name: 'Камуфляж седины', price: '400 CZK', time: '30 мин' },
                  { name: 'Укладка волос', price: '200 CZK', time: '15 мин' },
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 px-4 -mx-4 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-white font-medium">{item.name}</div>
                      <div className="text-gray-500 text-sm">{item.time}</div>
                    </div>
                    <div className="text-gold-400 font-display text-xl">{item.price}</div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-20 md:py-32 bg-slate-900/50">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
              <SafeIcon name="image" size={16} />
              Галерея
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white">
              НАШИ <span className="text-gradient">РАБОТЫ</span>
            </h2>
          </AnimatedSection>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((img, index) => (
              <AnimatedSection key={index} delay={index * 0.1} className={index === 0 ? 'col-span-2 row-span-2' : ''}>
                <div className="relative group overflow-hidden rounded-2xl aspect-square">
                  <img 
                    src={img} 
                    alt={`Work ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-white">
                      <SafeIcon name="scissors" size={16} className="text-gold-400" />
                      <span className="text-sm font-medium">BAZA Style</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="reviews" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
              <SafeIcon name="message-circle" size={16} />
              Отзывы
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white">
              ЧТО ГОВОРЯТ <span className="text-gradient">КЛИЕНТЫ</span>
            </h2>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((review, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <SafeIcon key={i} name="star" size={16} className="text-gold-400 fill-gold-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 flex-1 mb-4">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center">
                      <span className="text-gold-400 font-bold">{review.name[0]}</span>
                    </div>
                    <span className="text-white font-medium">{review.name}</span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 md:py-32 bg-slate-900/50">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
              <SafeIcon name="help-circle" size={16} />
              FAQ
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white">
              ЧАСТЫЕ <span className="text-gradient">ВОПРОСЫ</span>
            </h2>
          </AnimatedSection>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Нужно ли записываться заранее?',
                a: 'Да, мы работаем только по предварительной записи. Это позволяет нам уделить максимум внимания каждому клиенту без спешки и очередей.'
              },
              {
                q: 'Какие способы оплаты принимаете?',
                a: 'Мы принимаем наличные, карты Visa/Mastercard, Apple Pay, Google Pay и наличные CZK/EUR.'
              },
              {
                q: 'Можно ли прийти с ребёнком?',
                a: 'Да, у нас есть специальная услуга "Отец + Сын". Детям от 3 лет мы тоже делаем стрижки в комфортной обстановке.'
              },
              {
                q: 'Есть ли парковка рядом?',
                a: 'Да, рядом с барбершопом есть платная парковка на улице и несколько паркингов в шаговой доступности.'
              },
              {
                q: 'Что если я опоздаю?',
                a: 'Если вы опаздываете более чем на 15 минут, нам придётся сократить время процедуры или перенести запись, чтобы не подводить следующего клиента.'
              }
            ].map((item, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <FAQItem question={item.q} answer={item.a} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING FORM SECTION */}
      <section id="booking" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
                <SafeIcon name="calendar" size={16} />
                Онлайн-запись
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
                ЗАПИШИСЬ <span className="text-gradient">СЕЙЧАС</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Заполните форму, и мы свяжемся с вами для подтверждения записи. 
                Или позвоните нам напрямую: <span className="text-gold-400 font-bold">+420 123 456 789</span>
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-lg flex items-center justify-center">
                    <SafeIcon name="phone" size={24} className="text-gold-400" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Телефон</div>
                    <div className="text-white font-medium">+420 123 456 789</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-lg flex items-center justify-center">
                    <SafeIcon name="map-pin" size={24} className="text-gold-400" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Адрес</div>
                    <div className="text-white font-medium">Náměstí Míru 15, Praha 2</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold-500/10 rounded-lg flex items-center justify-center">
                    <SafeIcon name="clock" size={24} className="text-gold-400" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Часы работы</div>
                    <div className="text-white font-medium">Пн-Вс: 9:00 - 21:00</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
                {!isSuccess ? (
                  <form onSubmit={(e) => handleSubmit(e, ACCESS_KEY)} className="space-y-6">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Ваше имя</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                        placeholder="Иван Иванов"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Телефон</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                        placeholder="+420 123 456 789"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Услуга</label>
                      <select
                        name="service"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                      >
                        <option value="">Выберите услугу</option>
                        <option value="haircut">Мужская стрижка (600 CZK)</option>
                        <option value="beard">Стрижка бороды (400 CZK)</option>
                        <option value="shave">Королевское бритьё (500 CZK)</option>
                        <option value="complex">Комплекс (900 CZK)</option>
                        <option value="family">Отец + Сын (1000 CZK)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Дата и время</label>
                      <input
                        type="datetime-local"
                        name="datetime"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Комментарий</label>
                      <textarea
                        name="message"
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors resize-none"
                        placeholder="Особые пожелания..."
                      />
                    </div>
                    
                    {isError && (
                      <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                        {errorMessage}
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-slate-950 px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <SafeIcon name="send" size={20} />
                          Записаться
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <SafeIcon name="check-circle" size={40} className="text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Заявка отправлена!</h3>
                    <p className="text-gray-400 mb-8">
                      Мы свяжемся с вами в ближайшее время для подтверждения записи.
                    </p>
                    <button
                      onClick={resetForm}
                      className="text-gold-400 hover:text-gold-300 font-semibold transition-colors"
                    >
                      Отправить ещё одну заявку
                    </button>
                  </motion.div>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section id="contact" className="py-20 md:py-32 bg-slate-900/50">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-bold uppercase tracking-wider mb-4">
              <SafeIcon name="map-pin" size={16} />
              Как нас найти
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white">
              МЫ НА <span className="text-gradient">КАРТЕ</span>
            </h2>
          </AnimatedSection>
          
          <AnimatedSection>
            <CleanMap coordinates={[14.4378, 50.0755]} zoom={15} />
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 pb-24 md:pb-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
                  <span className="font-display text-2xl text-slate-950">B</span>
                </div>
                <span className="font-display text-2xl text-white">BAZA</span>
              </div>
              <p className="text-gray-500 text-sm">
                Профессиональный барбершоп в Праге. 
                Создаём стиль с 2019 года.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Услуги</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><button onClick={() => scrollToSection('services')} className="hover:text-gold-400 transition-colors">Мужская стрижка</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-gold-400 transition-colors">Борода и усы</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-gold-400 transition-colors">Королевское бритьё</button></li>
                <li><button onClick={() => scrollToSection('services')} className="hover:text-gold-400 transition-colors">Уход за кожей</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Контакты</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>Náměstí Míru 15, Praha 2</li>
                <li>+420 123 456 789</li>
                <li>info@baza-barbershop.cz</li>
                <li>Пн-Вс: 9:00 - 21:00</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Социальные сети</h4>
              <div className="flex gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-slate-950 transition-all">
                  <SafeIcon name="instagram" size={20} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-slate-950 transition-all">
                  <SafeIcon name="facebook" size={20} />
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-slate-950 transition-all">
                  <SafeIcon name="music" size={20} />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">© 2024 BAZA Barbershop. Все права защищены.</p>
            <div className="flex gap-6 text-gray-600 text-sm">
              <button className="hover:text-gray-400 transition-colors">Политика конфиденциальности</button>
              <button className="hover:text-gray-400 transition-colors">Условия использования</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-900/50 transition-colors"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <SafeIcon 
          name={isOpen ? 'minus' : 'plus'} 
          size={20} 
          className="text-gold-400 flex-shrink-0" 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <p className="p-6 pt-0 text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App