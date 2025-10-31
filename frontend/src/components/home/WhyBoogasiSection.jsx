import React from 'react';
import { Lock, GitCompareArrows, ShieldCheck, Shield, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

const features = [
  {
    icon: Lock,
    title: 'Exclusive Access Only',
    description: 'Every product and service listed on Boogasi is custom-built or uniquely offered for our private network. These opportunities are designed for members only — not found in public marketplaces or open directories.'
  },
  {
    icon: GitCompareArrows,
    title: 'Direct, Peer-to-Peer Connections',
    description: 'Boogasi enables trusted interactions between verified members. You connect directly with the source — no unnecessary layers.'
  },
  {
    icon: ShieldCheck,
    title: 'Verified & Trusted Supporters',
    description: 'Our network includes vetted individuals and organizations who power new ideas. Supporters are approved based on credibility and alignment.'
  },
  {
    icon: Shield,
    title: 'Privacy-First by Design',
    description: 'All activity is encrypted and secured within a private, access-controlled ecosystem to protect your projects.'
  },
  {
    icon: Brain,
    title: 'AI-Powered Discovery Tools',
    description: 'Advanced, responsible AI surfaces insights and emerging opportunities to help you make smarter decisions.'
  }
];

const WhyBoogasiSection = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const iconVariants = {
    initial: { filter: 'drop-shadow(0 0 0px var(--boogasi-blue-val))' },
    animate: { 
      filter: [
        'drop-shadow(0 0 0px var(--boogasi-blue-val))',
        'drop-shadow(0 0 5px var(--boogasi-blue-val))',
        'drop-shadow(0 0 10px var(--boogasi-blue-val))',
        'drop-shadow(0 0 5px var(--boogasi-blue-val))',
        'drop-shadow(0 0 0px var(--boogasi-blue-val))'
      ],
      transition: {
        repeat: Infinity,
        duration: 5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--background))]">
      <div className="absolute inset-0 z-0">
        {/* Background elements, if any */}
      </div>
      <div className="container mx-auto relative z-10">
        <motion.h2 
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-center mb-16 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--brighter-blue))] to-[hsl(var(--brighter-teal))]"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Why Boogasi?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full flex flex-col items-center text-center bg-gradient-to-br from-[hsl(var(--boogasi-black-val))] to-[hsl(var(--boogasi-grey-val))] border border-[hsl(var(--boogasi-purple-val))]/30 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--boogasi-blue-val))] to-[hsl(var(--boogasi-purple-val))] opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
                <CardHeader className="p-0 mb-4 flex flex-col items-center">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-[hsl(var(--boogasi-grey-val))] flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 border border-[hsl(var(--boogasi-blue-val))]/50 shadow-neon-blue-glow-sm"
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <feature.icon className="h-10 w-10 text-[hsl(var(--boogasi-blue-val))] icon-neon-blue" />
                  </motion.div>
                  <CardTitle className="text-xl font-bold text-[hsl(var(--primary-foreground))]">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-muted-foreground">
                  <p>{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyBoogasiSection;