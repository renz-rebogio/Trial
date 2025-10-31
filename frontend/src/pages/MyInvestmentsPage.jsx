import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Zap, Brain, FileText, Eye, RefreshCw, Search, ShieldCheck, Users, DatabaseZap, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { useAuth } from '@/hooks/useAuth';
import { simulateRandomAIAction, fetchInvestmentArticles } from '@/lib/aiSimulation';
import AIReportDisplay from '@/components/ai/AIReportDisplay'; 
import { useToast } from "@/components/ui/use-toast";


const MyInvestmentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiReport, setAiReport] = useState(null);
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [articles, setArticles] = useState([]);
  const [userName, setUserName] = useState("Valued User");

  useEffect(() => {
    if (user && user.user_metadata) {
        setUserName(user.user_metadata.name || user.user_metadata.screen_name || "Valued User");
    }
    setArticles(fetchInvestmentArticles());
  }, [user]);

  const handleRunAISimulation = async () => {
    setIsSimulatingAI(true);
    setAiReport(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
      const simulationResult = simulateRandomAIAction(userName);
      setAiReport(simulationResult);
      toast({
        title: "Boogasi AI Analysis Complete!",
        description: `Generated ${simulationResult.actionType} insights for ${userName}.`,
      });
    } catch (error) {
      console.error("Error during AI simulation:", error);
      setAiReport({
          reportTitle: "Simulation Error",
          reportContent: `Hello ${userName}, Boogasi AI encountered an issue: ${error.message}. Please try again.`,
          timestamp: new Date().toISOString()
      });
      toast({
        variant: "destructive",
        title: "AI Simulation Failed",
        description: `An error occurred: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setIsSimulatingAI(false);
    }
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeInOut",
      },
    }),
  };
  
  const pageTitle = user ? `Welcome to Your Investment Hub, ${userName}!` : "My Investments AI";

  const handleArticleClick = (article) => {
    // If article has a real URL, open it. Otherwise, show toast.
    if (article.url) {
      window.open(article.url, '_blank');
    } else {
      toast({
        title: "🚧 Feature not implemented",
        description: "Detailed article view coming soon!",
      });
    }
  };


  return (
    <div className="container mx-auto py-12 px-4 space-y-12 brighter-theme-area min-h-screen"> {/* Apply brighter theme */}
      <motion.header 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="inline-block p-4 bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] to-[hsl(var(--boogasi-teal-val))] rounded-full shadow-2xl mb-2">
          <TrendingUp className="h-12 w-12 text-white icon-neon-blue" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--boogasi-blue-val))] via-[hsl(var(--boogasi-teal-val))] to-[hsl(var(--boogasi-orange-val))]">
          {pageTitle}
        </h1>
        <p className="text-lg md:text-xl text-[hsl(var(--brighter-muted-foreground-val))] max-w-3xl mx-auto">
          Leverage Boogasi AI to analyze your investment strategies, track performance, and discover new opportunities.
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="shadow-2xl backdrop-blur-sm w-full"> {/* Card will inherit */}
          <CardHeader>
            <CardTitle className="text-3xl font-semibold flex items-center">
              <Zap className="mr-3 h-8 w-8 text-[hsl(var(--boogasi-purple-val))] icon-neon-purple" />
              Dynamic AI Investment Analysis
            </CardTitle>
            <CardDescription className="text-base text-[hsl(var(--brighter-muted-foreground-val))]">
              Click the button below to let Boogasi AI perform a random analysis from various categories like portfolio performance, expense tracking, or market forecasting, providing fresh insights each time. The AI will greet you by name and deliver a unique, AI-generated investment report based on the most updated sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <LoadingButton
              onClick={handleRunAISimulation}
              isLoading={isSimulatingAI}
              className="w-full md:w-auto bg-gradient-to-r from-[hsl(var(--boogasi-orange-val))] to-[hsl(var(--boogasi-pink-val))] text-primary-foreground hover:opacity-90 text-lg py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-150"
              size="lg"
            >
              <Brain className="mr-2 h-5 w-5 icon-neon-cyan" /> Run AI Analysis
            </LoadingButton>
            
            {isSimulatingAI && (
              <div className="mt-4 text-lg text-[hsl(var(--boogasi-purple-val))] font-medium flex items-center justify-center">
                <Loader2 className="mr-2 h-6 w-6 animate-spin icon-neon-purple" />
                Boogasi AI is crunching the latest data for you, {userName}...
              </div>
            )}

            {aiReport && (
                <AIReportDisplay reportContent={aiReport.reportContent} />
            )}
          </CardContent>
        </Card>
      </motion.section>
      
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="space-y-8"
      >
        <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center">
          <BarChart3 className="mr-3 h-8 w-8 text-[hsl(var(--boogasi-teal-val))] icon-neon-teal" />
          Key Platform Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { 
              icon: <FileText className="h-8 w-8 text-[hsl(var(--boogasi-blue-val))] icon-neon-blue" />, 
              title: "AI-Powered Opportunity Search", 
              description: "Boogasi AI continuously scours major search engines and leading financial news platforms (Bloomberg, Reuters, WSJ) to identify emerging investment opportunities and trends. (Simulated)"
            },
            { 
              icon: <Eye className="h-8 w-8 text-[hsl(var(--boogasi-green-val))] icon-neon-green" />, 
              title: "Data Aggregation & Synthesis", 
              description: "Our AI aggregates data from diverse, credible sources, synthesizing complex information into clear, actionable insights and summaries. (Simulated)" 
            },
            { 
              icon: <RefreshCw className="h-8 w-8 text-[hsl(var(--boogasi-purple-val))] icon-neon-purple" />, 
              title: "Personalized Discovery Feed", 
              description: "Receive daily updates with investment opportunities tailored to your interests and risk profile, directly in your personalized feed. (Simulated)"
            },
            { 
              icon: <Search className="h-8 w-8 text-[hsl(var(--boogasi-pink-val))] icon-neon-pink" />, 
              title: "Credible Source Prioritization", 
              description: "Boogasi AI prioritizes information from globally recognized and credible financial news sources to ensure the reliability of insights. (Simulated)"
            },
            { 
              icon: <ShieldCheck className="h-8 w-8 text-[hsl(var(--boogasi-teal-val))] icon-neon-teal" />, 
              title: "Secure Data Handling", 
              description: "Your financial data is handled with bank-level security and privacy, ensuring your information remains confidential." 
            },
            { 
              icon: <DatabaseZap className="h-8 w-8 text-[hsl(var(--boogasi-orange-val))] icon-neon-orange" />, 
              title: "Integration with Boogasi Ecosystem", 
              description: "Seamlessly connect your investment insights with the broader Boogasi platform for deal-making and collaboration." 
            },
          ].map((feature, index) => (
            <motion.custom
              key={index}
              custom={index}
              variants={featureCardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.03, boxShadow: "0px 10px 20px hsla(var(--brighter-blue-val),0.1)" }}
              className="p-6 rounded-xl shadow-lg border flex flex-col items-center text-center" /* Card will inherit */
            >
              <div className="p-3 bg-[hsl(var(--my-investments-card-icon-bg))] rounded-full mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--brighter-foreground-val))]">{feature.title}</h3>
              <p className="text-sm text-[hsl(var(--brighter-muted-foreground-val))]">{feature.description}</p>
            </motion.custom>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="space-y-8"
      >
        <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center">
           <Users className="mr-3 h-8 w-8 text-[hsl(var(--boogasi-blue-val))] icon-neon-blue" />
          Curated Investment Insights (Simulated by Boogasi AI)
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <motion.custom
              key={article.id}
              custom={articles.indexOf(article)}
              variants={featureCardVariants}
              initial="hidden"
              animate="visible"
              className="p-6 rounded-lg shadow-lg border cursor-pointer hover:shadow-xl transition-shadow" /* Card will inherit */
              onClick={() => handleArticleClick(article)}
            >
              <h3 className="text-lg font-semibold text-[hsl(var(--boogasi-blue-val))] mb-2 group-hover:underline">
                {article.title} 
                {article.url && <ExternalLink size={14} className="inline ml-1 opacity-70" />}
              </h3>
              <p className="text-sm mb-3 text-[hsl(var(--brighter-muted-foreground-val))]">{article.summary}</p>
              <div className="flex justify-between items-center text-xs text-[hsl(var(--brighter-muted-foreground-val))]">
                <span>Source: {article.sourceName}</span>
                <span>Published: {new Date(article.publishedDate).toLocaleDateString()}</span>
              </div>
              <div className="mt-2">
                {article.tags.map(tag => (
                  <span key={tag} className="inline-block bg-[hsl(var(--boogasi-teal-val))]/20 text-[hsl(var(--boogasi-teal-val))] text-xs px-2 py-1 rounded-full mr-1 mb-1">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.custom>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default MyInvestmentsPage;