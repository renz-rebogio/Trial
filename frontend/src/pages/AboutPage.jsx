import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Zap, Target, Globe, DollarSign, HeartHandshake as Handshake, Cpu, Package, TrendingUp, Sparkles, BadgeDollarSign } from 'lucide-react'; 

const AboutPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const teamMembers = [
    { name: "Bo G.", role: "Founder & Visionary", imgKey: "Portrait of Bo G." , alt: "Bo G., Founder"},
  ];

  const platformFeatures = [
    { icon: <Package size={28} className="text-boogasi-blue" />, title: "Marketplace", description: "For investors and emerging products or companies." },
    { icon: <Users size={28} className="text-boogasi-red" />, title: "Free Membership", description: "Zero monthly subscription fees for all users." },
    { icon: <Cpu size={28} className="text-boogasi-cyan" />, title: "Free AI Tools", description: "Available to all users for enhanced analysis." },
    { icon: <BadgeDollarSign size={28} className="text-boogasi-yellow" />, title: "Success-Based Fees", description: "No selling fees unless a deal is made—only pay when you succeed." },
  ];


  return (
    <motion.div 
      className="container mx-auto py-12 px-4 space-y-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section variants={itemVariants} className="text-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-boogasi-blue via-boogasi-red to-boogasi-yellow">
          About Us
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Boogasi is a private network and growing database designed to connect private investors with high-potential opportunities in a secure and focused environment. Our mission is to foster valuable, strategic relationships while maintaining a strong commitment to privacy, integrity, and professional conduct.
        </p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-4 text-foreground">Our Vision</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              In a world overwhelmed by noise and distractions, Boogasi offers a refined space—a network where investment opportunities, products, and services can thrive without interference. We combine privacy with powerful technology to help our members discover, evaluate, and grow ventures with confidence.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Our platform is evolving into more than just a connection hub. We are actively developing AI-powered tools and software specifically designed to assist with investment analysis and decision-making. While these tools are still in the testing and improvement phase, they reflect our broader commitment to innovation.
            </p>
            <p className="text-muted-foreground font-semibold text-primary leading-relaxed">
              At Boogasi, we believe in collaboration over competition. We’re building a trusted digital infrastructure—a place where private investors, innovators, and product developers can come together to create meaningful opportunities.
            </p>
          </div>
          <div className="rounded-lg overflow-hidden shadow-xl glassmorphic">
             <img  alt="Abstract network of interconnected nodes, symbolizing connections and technology" className="w-full h-auto object-cover" src="https://images.unsplash.com/photo-1700941019917-731dc64ce685" />
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">Our Platform Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {platformFeatures.map(feature => (
            <div key={feature.title} className="p-6 rounded-xl glassmorphic text-center border border-primary/20 hover:shadow-lg transition-shadow">
              <div className="inline-block p-4 bg-card rounded-full mb-4 shadow-md">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </motion.section>
      
      {teamMembers.length > 0 && (
        <motion.section variants={itemVariants}>
          <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">Meet the Founder</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {teamMembers.map(member => (
              <div key={member.name} className="text-center p-6 rounded-xl glassmorphic w-full max-w-sm border border-secondary/20">
                <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-secondary shadow-lg">
                  <img  alt={member.alt} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1656909708546-cd07fe6ce1e6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
                <p className="text-secondary">{member.role}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default AboutPage;