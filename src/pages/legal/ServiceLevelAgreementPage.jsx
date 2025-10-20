import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, ShieldCheck, Server, Users as UsersIcon, AlertTriangle, Edit, Gavel } from 'lucide-react'; // Added Users as UsersIcon to avoid conflict

const ServiceLevelAgreementPage = () => {
  const slaSections = [
    {
      title: "Introduction",
      icon: FileText,
      content: [
        "This Service Level Agreement (“SLA”) outlines the level of service that Boogasi (“we,” “us,” “our”) aims to provide to its users (“you,” “your”) for the services offered through our website and platform.",
        "This SLA is an integral part of our Terms and Conditions. By using our services, you agree to the terms of this SLA."
      ]
    },
    {
      title: "Service Availability",
      icon: Server,
      content: [
        "<strong>Target Uptime:</strong> We strive to maintain a 99.9% uptime for our core platform services, calculated monthly. “Uptime” means the time the core services are available and functioning correctly."
      ],
      subsections: [
        {
          title: "Exclusions from Uptime Calculation:",
          points: [
            "Scheduled Maintenance (48 hours’ notice, typically off-peak)",
            "Emergency Maintenance (reasonable user notification)",
            "Force Majeure Events (acts of God, disasters, cyber-attacks, third-party failures)",
            "User-caused Issues (equipment, software, or misuse)",
            "Third-party API/Service Outages integrated into Boogasi"
          ]
        }
      ]
    },
    {
      title: "Support Services",
      icon: Clock,
      content: [
        "<strong>Support Channels:</strong> Email at support@boogasi.com and contact form on our website.",
        "<strong>Response Times:</strong> Target initial response within 24 business hours for all inquiries.",
        "<strong>Business hours:</strong> Monday–Friday, 9:00 AM to 5:00 PM [EST]."
      ]
    },
    {
      title: "Data Backup and Recovery",
      icon: ShieldCheck,
      content: [
        "We perform regular backups. Recovery Point Objective (RPO) is 24 hours; Recovery Time Objective (RTO) is 48 hours for critical data.",
        "You are responsible for your own backups of critical data."
      ]
    },
    {
      title: "Security",
      icon: ShieldCheck,
      content: [
        "We implement industry-standard security measures including encryption and access controls.",
        "We will notify users of any data breaches in accordance with law."
      ]
    },
    {
      title: "User Responsibilities",
      icon: UsersIcon,
      intro: "You agree to:",
      points: [
        "Provide accurate info when reporting issues",
        "Keep your account credentials secure",
        "Maintain adequate systems and internet connection",
        "Comply with Terms and Acceptable Use Policy"
      ]
    },
    {
      title: "SLA Exclusions and Limitations",
      icon: AlertTriangle,
      intro: "This SLA excludes:",
      points: [
        "Beta, trial, or free-tier services (provided “as-is”)",
        "Services or features explicitly excluded",
        "Issues due to your breach of Terms"
      ],
      additionalContent: [
        "Our liability is limited to service credits or remedies in separate agreements and does not exceed amounts paid."
      ]
    },
    {
      title: "Amendments",
      icon: Edit,
      content: [
        "We may amend this SLA anytime and will notify you of material changes.",
        "Continued use implies acceptance."
      ]
    },
    {
      title: "Governing Law",
      icon: Gavel,
      content: [
        "This SLA shall be governed by the laws of Delaware, United States."
      ]
    }
  ];

  return (
    <motion.div
      className="page-container bg-gradient-to-br from-background to-muted/30 py-12 px-4 sm:px-6 lg:px-8 text-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto bg-card p-6 sm:p-8 lg:p-10 rounded-xl shadow-2xl border border-border/50">
        <h1 className="text-4xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-pink-500">
          Service Level Agreement (SLA)
        </h1>
        <p className="text-center text-muted-foreground mb-10">
          Last updated: June 9, 2025
        </p>

        {slaSections.map((section, index) => (
          <motion.section 
            key={index} 
            className="mb-8 last:mb-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center mb-4">
              {section.icon && <section.icon className="w-7 h-7 mr-3 text-primary" />}
              <h2 className="text-2xl font-semibold text-primary/90">{section.title}</h2>
            </div>
            
            {section.intro && <p className="text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: section.intro }}></p>}

            {section.content && section.content.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-muted-foreground leading-relaxed mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: paragraph }}></p>
            ))}
            
            {section.points && (
              <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-relaxed pl-4 mt-2">
                {section.points.map((point, pIndex) => (
                  <li key={pIndex} dangerouslySetInnerHTML={{ __html: point }}></li>
                ))}
              </ul>
            )}

            {section.subsections && section.subsections.map((subsection, sIndex) => (
              <div key={sIndex} className="mt-4 pl-6 border-l-2 border-primary/20">
                <h3 className="text-xl font-medium mb-2 text-primary/80">{subsection.title}</h3>
                {subsection.content && subsection.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-muted-foreground leading-relaxed mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: paragraph }}></p>
                ))}
                {subsection.points && (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground leading-relaxed pl-4 mt-2">
                    {subsection.points.map((point, pIndex) => (
                      <li key={pIndex} dangerouslySetInnerHTML={{ __html: point }}></li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            
            {section.additionalContent && section.additionalContent.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-muted-foreground leading-relaxed mt-3" dangerouslySetInnerHTML={{ __html: paragraph }}></p>
            ))}
          </motion.section>
        ))}
        
      </div>
    </motion.div>
  );
};

export default ServiceLevelAgreementPage;