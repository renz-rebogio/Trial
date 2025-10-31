import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Users, TrendingUp, Cpu, Lock } from 'lucide-react';
import WhyBoogasiSection from '@/components/home/WhyBoogasiSection';

const HomePage = () => {
  const heroSectionVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const featuresSectionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const ctaSectionVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "backOut" } },
  };

  const features = [
    { title: "AI-Powered Insights", description: "Leverage cutting-edge AI for market analysis and investment strategies.", icon: <Cpu className="h-10 w-10 text-[hsl(var(--boogasi-blue-val))]" />, color: "blue" },
    { title: "Secure Transactions", description: "Invest with confidence through our encrypted and verified platform.", icon: <ShieldCheck className="h-10 w-10 text-[hsl(var(--boogasi-green-val))]" />, color: "green" },
    { title: "Community Driven", description: "Connect with a network of investors and entrepreneurs.", icon: <Users className="h-10 w-10 text-[hsl(var(--boogasi-purple-val))]" />, color: "purple" },
    { title: "Growth Opportunities", description: "Discover unique investment opportunities and scale your portfolio.", icon: <TrendingUp className="h-10 w-10 text-[hsl(var(--boogasi-orange-val))]" />, color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-slate-900 to-black text-foreground brighter-theme-area">
      <motion.section 
        className="py-20 md:py-32 text-center"
        variants={heroSectionVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] via-[hsl(var(--boogasi-teal-val))] to-[hsl(var(--boogasi-green-val))]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
          >
            Boogasi AI
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-[hsl(var(--brighter-muted-foreground-val))] max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Empowering Your Financial Future with Intelligent Investment Solutions and a Dynamic Marketplace.
          </motion.p>
          <motion.div 
            className="space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] to-[hsl(var(--boogasi-teal-val))] hover:opacity-90 transition-opacity duration-300 text-primary-foreground px-8 py-6 text-lg shadow-lg hover:shadow-[hsl(var(--boogasi-blue-val))]/50">
              <Link to="/auth?type=register">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-[hsl(var(--boogasi-pink-val))] text-[hsl(var(--boogasi-pink-val))] hover:bg-[hsl(var(--boogasi-pink-val))]/10 hover:text-[hsl(var(--boogasi-pink-val))] px-8 py-6 text-lg shadow-lg hover:shadow-[hsl(var(--boogasi-pink-val))]/40">
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="py-16 md:py-24 bg-[hsl(var(--brighter-card-alt-bg-val))]"
        variants={featuresSectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-[hsl(var(--brighter-foreground-val))]">
            Experience a network that will allow you to make real deals
          </h2>
          <p className="text-lg text-center text-[hsl(var(--brighter-muted-foreground-val))] mb-16 max-w-2xl mx-auto">
            Boogasi offers a comprehensive suite of tools and features designed for modern investors and entrepreneurs.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={featureCardVariants}>
                <Card className="text-center h-full bg-[hsl(var(--brighter-card-bg-val))] border-[hsl(var(--brighter-border-val))] shadow-xl hover:shadow-[hsl(var(--boogasi-purple-val))]/30 transition-shadow duration-300">
                  <CardHeader className="items-center">
                    <div className={`p-4 rounded-full bg-gradient-to-br from-[hsl(var(--boogasi-${feature.color}-val))]/20 to-[hsl(var(--boogasi-${feature.color}-val))]/5 mb-4 inline-block`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-2xl text-[hsl(var(--brighter-foreground-val))]">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[hsl(var(--brighter-muted-foreground-val))]">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
           <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--boogasi-orange-val))] to-[hsl(var(--boogasi-green-val))] hover:opacity-90 transition-opacity duration-300 text-primary-foreground px-8 py-6 text-lg shadow-lg hover:shadow-[hsl(var(--boogasi-orange-val))]/50">
              <Link to="/privacy-policy">
                <Lock className="mr-2 h-5 w-5" /> Boogasi Private Network
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <WhyBoogasiSection />

      <motion.section 
        className="py-20 md:py-32"
        variants={ctaSectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[hsl(var(--brighter-foreground-val))]">Ready to Elevate Your Investments?</h2>
          <p className="text-xl text-[hsl(var(--brighter-muted-foreground-val))] max-w-2xl mx-auto mb-10">
            Join Boogasi AI today and unlock the power of intelligent investing and a vibrant marketplace.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--boogasi-pink-val))] to-[hsl(var(--boogasi-purple-val))] hover:opacity-90 transition-opacity duration-300 text-primary-foreground px-10 py-7 text-xl shadow-xl hover:shadow-[hsl(var(--boogasi-pink-val))]/60">
            <Link to="/auth?type=register">Create Your Account</Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;