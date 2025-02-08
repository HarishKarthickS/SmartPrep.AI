import React from 'react';
import { motion } from 'framer-motion';

const SmartPrepLanding = () => {
  // Define the 12 SmartPrep features array
  const smartprepFeatures = [
    {
      title: "Personalized Summaries",
      description: "Generate concise summaries tailored to your learning style.",
    },
    {
      title: "Custom Quiz Generation",
      description: "Automatically create quizzes based on your study materials.",
    },
    {
      title: "Progress Tracking",
      description: "Monitor your improvement with real‑time analytics.",
    },
    {
      title: "AI‑Powered Insights",
      description: "Receive smart recommendations to optimize your study sessions.",
    },
    {
      title: "Smart Study Planner",
      description: "Plan and manage your study schedule intelligently.",
    },
    {
      title: "Audio Learning",
      description: "Convert your notes to audio for on‑the‑go learning.",
    },
    {
      title: "Interactive Flashcards",
      description: "Revise using AI‑generated interactive flashcards.",
    },
    {
      title: "Collaborative Learning",
      description: "Engage in study groups and share insights with peers.",
    },
    {
      title: "Comprehensive Dashboard",
      description: "Visualize your progress and key metrics at a glance.",
    },
    {
      title: "Adaptive Content",
      description: "Experience content that adapts to your pace of learning.",
    },
    {
      title: "Seamless Integration",
      description: "Connect effortlessly with your favorite tools and apps.",
    },
    {
      title: "24/7 Support",
      description: "Get round‑the‑clock assistance from our AI‑driven platform.",
    },
  ];

  // Compute random sizes (in pixels) for the left and right decorative images
  const leftImageSize = Math.floor(Math.random() * 50) + 50; // random width between 50px and 100px
  const rightImageSize = Math.floor(Math.random() * 50) + 50; // random width between 50px and 100px

  // URL of the main hero image (now used as a decorative thumbnail)
  const heroImageUrl =
    "https://cdn.builder.io/api/v1/image/assets/TEMP/23d1a9ad72103fd7808352ed0ea742c037617cd4ac5d3e78271e0c7da77a7445?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79";

  return (
    <motion.div
      className="landing-page bg-black text-white font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Header Section */}
      <header className="header flex flex-col md:flex-row justify-between items-center px-12 py-6 border-b border-gray-700">
        <nav className="nav-bar flex gap-6 mb-4 md:mb-0">
          {['About', 'Technologies', 'Products', 'Discover'].map(item => (
            <motion.div
              key={item}
              className="nav-item text-sm cursor-pointer"
              whileHover={{ scale: 1.1 }}
            >
              {item}
            </motion.div>
          ))}
        </nav>
        <div className="logo flex items-center gap-2 mb-4 md:mb-0">
          <motion.img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/7a61c456db2d140b6cd59cf12f5fcf71accbfcbbe0a54f71e7d93005240461e2?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
            alt="SmartPrep Logo"
            className="w-8 h-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="logo-text flex gap-1">
            <span className="smart-prep text-xl font-semibold">SmartPrep</span>
            <span className="ai text-xl">AI</span>
          </div>
        </div>
        <nav className="nav-bar-secondary flex gap-6 items-center">
          {['Team', 'Pricing', 'Buy Premium'].map(item => (
            <motion.div
              key={item}
              className="nav-item text-sm cursor-pointer"
              whileHover={{ scale: 1.1 }}
            >
              {item}
            </motion.div>
          ))}
          <motion.button
            className="get-started-btn px-6 py-2 bg-white text-black rounded-full font-medium text-sm flex items-center gap-2"
            whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
          >
            Get Started
            <motion.span
              className="arrow-icon inline-block"
              animate={{ rotate: 90 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ➤
            </motion.span>
          </motion.button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section relative flex items-center justify-center px-12 py-20">
        {/* Centered hero content */}
        <motion.div
          className="hero-content text-center max-w-3xl"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="hero-title text-5xl font-bold leading-tight mb-6">
            <span className="hero-subtitle block text-2xl font-semibold mb-2">
              SmartPrep AI
            </span>
            Learn Efficiently.
            <br />
            Summarize, Quiz, Track & Improve.
          </h1>
          <p className="hero-description text-base text-gray-400 mb-8">
            Welcome to SmartPrep. Effortlessly summarize notes, generate quizzes, and track your progress.
            Personalize your learning and stay ahead with AI‑driven insights.
          </p>
          <div className="cta-buttons flex gap-4 justify-center">
            <motion.button
              className="start-generating-btn px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-black transition-all"
              whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
            >
              Start Generating
            </motion.button>
            <motion.button
              className="download-btn px-6 py-2 bg-white text-black rounded-full hover:shadow-lg transition-all"
              whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
            >
              Download
            </motion.button>
          </div>
        </motion.div>

        {/* Left decorative small image */}
        <motion.img
          src={heroImageUrl}
          alt="Decorative"
          className="absolute left-4 top-1/4"
          style={{ width: `${leftImageSize}px` }}
        />

        {/* Right decorative small image */}
        <motion.img
          src={heroImageUrl}
          alt="Decorative"
          className="absolute right-4 bottom-1/4"
          style={{ width: `${rightImageSize}px` }}
        />
      </section>

      {/* Features Section with Auto-Scrolling/Marquee Effect */}
      <section className="features-section px-12 py-20">
        <motion.h2
          className="section-title text-4xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Discover SmartPrep Features
        </motion.h2>
        <div className="feature-cards overflow-hidden">
          <motion.div
            className="flex gap-8"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
          >
            {smartprepFeatures.map((feature, index) => (
              <div
                key={index}
                className="feature-card bg-gray-900 p-6 rounded-md flex flex-col gap-4 hover:shadow-xl transition-all min-w-[250px]"
              >
                <h3 className="feature-title text-xl font-semibold">{feature.title}</h3>
                <p className="feature-description text-base text-gray-400">{feature.description}</p>
              </div>
            ))}
            {/* Duplicate items for seamless scrolling */}
            {smartprepFeatures.map((feature, index) => (
              <div
                key={index + smartprepFeatures.length}
                className="feature-card bg-gray-900 p-6 rounded-md flex flex-col gap-4 hover:shadow-xl transition-all min-w-[250px]"
              >
                <h3 className="feature-title text-xl font-semibold">{feature.title}</h3>
                <p className="feature-description text-base text-gray-400">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="topics-section px-12 py-20 text-center">
        <motion.h2
          className="section-title text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Explore Popular Study Topics
        </motion.h2>
        <motion.p
          className="section-description text-base text-gray-400 mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Master your studies with SmartPrep. Summarize notes, generate quizzes, and track your progress with AI.
          Stay ahead with personalized insights.
        </motion.p>
        <div className="cta-buttons flex justify-center gap-4 mb-12">
          <motion.button
            className="start-generating-btn px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-black transition-all"
            whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
          >
            Start Generating
          </motion.button>
          <motion.button
            className="download-btn px-6 py-2 bg-white text-black rounded-full hover:shadow-lg transition-all"
            whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
          >
            Download
          </motion.button>
        </div>
        <motion.img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/15027d63fb3d8666d99701c8f00c92d8421e02dbd2c7cbe5536620ef230e28fc?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
          alt="Topics illustration"
          className="topics-img w-full h-auto mt-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
      </section>

      {/* Study Section with Real Images */}
      <section className="study-section px-12 py-20">
        <motion.h2
          className="section-title text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Study like never before with SmartPrep
        </motion.h2>
        <motion.p
          className="section-description text-base text-gray-400 mb-12 max-w-3xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Unlock smarter learning with SmartPrep. Experience an immersive study environment designed to boost your focus and retention through engaging visuals and interactive resources.
        </motion.p>
        <div className="study-gallery flex flex-col md:flex-row gap-4">
          {/* Main Large Image */}
          <motion.div
            className="gallery-main flex-1 rounded-md overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <img
              src="https://source.unsplash.com/800x600/?study,desk"
              alt="Focused studying at a desk"
              className="w-full h-full object-cover"
            />
          </motion.div>
          {/* Grid of Four Images */}
          <div className="gallery-grid grid grid-cols-2 gap-4 flex-1">
            {[
              {
                src: "https://source.unsplash.com/400x300/?books",
                alt: "Stacks of books for study",
              },
              {
                src: "https://source.unsplash.com/400x300/?library",
                alt: "Quiet library environment",
              },
              {
                src: "https://source.unsplash.com/400x300/?notebook",
                alt: "Notebooks and writing materials",
              },
              {
                src: "https://source.unsplash.com/400x300/?coffee,study",
                alt: "Coffee and study setup",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="gallery-item rounded-md overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.1 }}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Section */}
      <section className="audio-section px-12 py-20">
        <motion.h2
          className="section-title text-4xl font-bold mb-4 text-center"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Transform your learning experience with SmartPrep
        </motion.h2>
        <motion.p
          className="section-description text-base text-gray-400 mb-12 max-w-3xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Generate personalized audio summaries, quiz music tracks, and study soundscapes effortlessly.
          Boost focus and retention while AI tailors your study sessions.
        </motion.p>
        <div className="audio-features flex flex-col lg:flex-row items-center gap-8">
          <div className="audio-content flex-1">
            <motion.h3
              className="audio-title text-3xl font-semibold mb-4"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Enhance Your Learning with Ultra‑Realistic AI Voices
            </motion.h3>
            <motion.p
              className="audio-description text-lg text-gray-400 mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Create engaging voice content with unique AI Voices perfect for your audience.
              Generate Conversational, Long‑form or Short‑form Voice Content with consistent quality.
            </motion.p>
            <div className="audio-tags flex flex-wrap gap-4 mb-6">
              {[
                'Train voice models',
                'Text‑to‑speech',
                'AI voice generation',
                'AI music production',
                'AI Composition',
              ].map(tag => (
                <motion.span
                  key={tag}
                  className="audio-tag border border-white rounded-full px-4 py-2 text-lg hover:bg-white hover:text-black transition-all"
                  whileHover={{ scale: 1.05 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
            <motion.button
              className="generate-btn px-6 py-2 bg-white text-black rounded-full font-medium transition-all"
              whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
            >
              Generate now
            </motion.button>
          </div>
          <motion.img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/49d3394c00338e6ab988da7af6faf4476043fa3d1ac1eb0be791e9f2d405873b?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
            alt="Audio feature illustration"
            className="audio-img flex-1 w-full h-auto rounded-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section relative bg-gray-900 rounded-lg py-16 px-6 text-center overflow-hidden">
        <motion.img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/ad9fbca72ed149968aa18990f2ef067db37f8d245910cec49800fadf7af0abcf?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
          alt="Decoration"
          className="cta-img-1 absolute top-0 left-0 w-24 h-24 opacity-50"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 0.5 }}
          transition={{ duration: 1 }}
        />
        <motion.img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/7ddb7599d9c4701025ffeb66c5efe6594930338d5600e61f9a5a5170f8e1e2a0?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
          alt="Decoration"
          className="cta-img-2 absolute bottom-0 right-0 w-24 h-24 opacity-50"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 0.5 }}
          transition={{ duration: 1 }}
        />
        <motion.img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/bcb65d5a6a661f9c3af7102b7a9f102d9645e18b6faaad3631850ee6fd0c9c41?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79"
          alt="Decoration"
          className="cta-img-3 absolute top-1/2 left-1/2 w-16 h-16 opacity-50 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 1 }}
        />
        <div className="cta-content relative z-10">
          <motion.h2
            className="cta-title text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            SmartPrep has no boundaries. Start your journey to smarter learning with SmartPrep.
          </motion.h2>
          <motion.button
            className="create-account-btn px-6 py-2 bg-white text-black rounded-full font-medium transition-all"
            whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
          >
            Create an Account
          </motion.button>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer px-12 py-12 border-t border-gray-700">
        <div className="footer-columns flex flex-col md:flex-row justify-between gap-8">
          <div className="footer-column">
            <div className="footer-section mb-6">
              <h4 className="footer-title text-xs text-gray-400 mb-4">Navigation</h4>
              <div className="footer-links flex gap-12">
                <div className="footer-link-column flex flex-col gap-2">
                  {['Schedule', 'Courses', 'Pricing', 'Payment', 'Study', 'Books'].map(link => (
                    <a key={link} href="#" className="footer-link text-sm text-white hover:text-blue-400 transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
                <div className="footer-link-column flex flex-col gap-2">
                  {['About school', 'Gallery', 'News', 'Contacts'].map(link => (
                    <a key={link} href="#" className="footer-link text-sm text-white hover:text-blue-400 transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="footer-bottom flex gap-4 items-center">
              <a href="#" className="footer-bottom-link text-xs text-gray-400 hover:text-blue-400 transition-colors">
                Copyright
              </a>
              <a href="#" className="footer-bottom-link text-xs text-gray-400 hover:text-blue-400 transition-colors">
                Privacy
              </a>
              <span className="footer-bottom-text text-xs text-gray-400">
                All rights reserved
              </span>
            </div>
          </div>
          <div className="footer-column">
            <div className="footer-section mb-6">
              <h4 className="footer-title text-xs text-gray-400 mb-4">Contact us</h4>
              <div className="contact-info flex flex-col gap-1">
                <div className="contact-phone text-sm text-gray-300">
                  <p>+19 9042370348</p>
                </div>
                <p className="contact-email text-sm text-gray-300">hellp@promptverse.com</p>
              </div>
            </div>
            <div className="footer-social flex gap-6 mb-6">
              <div className="social-section">
                <h4 className="footer-title text-xs text-gray-400 mb-2">Follow us</h4>
                <div className="social-icons flex gap-2">
                  {[
                    'https://cdn.builder.io/api/v1/image/assets/TEMP/40da11a9f7415b1dcbc764b1fdefc7852a43376fa6713f1ff0172a3df1d5205f?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79',
                    'https://cdn.builder.io/api/v1/image/assets/TEMP/450731445c20a172445310f14983db829dd257087cdedd27362b0a788ad04079?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79',
                    'https://cdn.builder.io/api/v1/image/assets/TEMP/b1aa09d82e07008c82055442aad12cd5bb53f37d92c3dfa7a368847e96a75851?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79',
                    'https://cdn.builder.io/api/v1/image/assets/TEMP/c5e8b2e80c0b31131865a7fffd35f57781c7d411ffc26e1a305279c3c04ac61a?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79',
                  ].map((src, index) => (
                    <a
                      key={index}
                      href="#"
                      className="social-icon w-12 h-12 border border-gray-400 rounded-full flex items-center justify-center hover:border-blue-400 transition-all"
                    >
                      <img src={src} alt="Social icon" className="w-6 h-6" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="social-section">
                <h4 className="footer-title text-xs text-gray-400 mb-2">Let's chat</h4>
                <div className="social-icons flex gap-2">
                  {[
                    'https://cdn.builder.io/api/v1/image/assets/TEMP/6419b2f6b6ac3ef40b4ca742bbd477337c32cce2ca2ba96ba5bfb9d0538ccf1a?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79',
                    'https://cdn.builder.io/api/v1/image/assets/TEMP/69ec0bad8b2240f4945a33be7ebcff9497f70e5c37b97d02317b54e42acbd7f7?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79',
                    'https://cdn.builder.io/api/v1/image/assets/TEMP/09c952b9cdc687a6c1286c0c89d7d245d664b47e8ee012ea6d46e04c0034b913?placeholderIfAbsent=true&apiKey=067c5bb5a47e48ceb34000b3d7a35b79',
                  ].map((src, index) => (
                    <a
                      key={index}
                      href="#"
                      className="social-icon w-12 h-12 border border-gray-400 rounded-full flex items-center justify-center hover:border-blue-400 transition-all"
                    >
                      <img src={src} alt="Chat icon" className="w-6 h-6" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="footer-location">
              <h4 className="footer-title text-xs text-gray-400 mb-2">Location</h4>
              <p className="location-address text-sm text-gray-300">Chennai</p>
            </div>
          </div>
          <div className="footer-bottom flex flex-col items-start">
            <div className="language-selector flex gap-4">
              {['En', 'Es'].map(lang => (
                <span key={lang} className="language text-xs text-gray-400 hover:text-blue-400 cursor-pointer">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default SmartPrepLanding;
