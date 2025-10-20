import React from 'react';

const TermsAndConditionsPage = () => {
  const terms = [
    {
      title: "1. Introduction",
      content: "Welcome to Boogasi. By accessing or using this platform, you agree to be bound by these Terms and Conditions."
    },
    {
      title: "2. Intellectual Property",
      content: "All platform content (excluding user-generated content) is owned by Boogasi and its licensors. Users are granted a limited license for personal, non-commercial use only."
    },
    {
      title: "3. Restrictions",
      content: "You may not:\n- Republish or resell any Boogasi content\n- Use the platform for unlawful purposes\n- Mine or extract data without written permission\n- Present AI-generated content as professional advice"
    },
    {
      title: "4. User Content",
      content: "Users retain ownership of their content but grant Boogasi a non-exclusive, global license to display and distribute it. Boogasi may remove any content at its discretion."
    },
    {
      title: "5. AI Tools & Disclaimer",
      content: "Boogasi uses artificial intelligence to provide insights and summaries for informational purposes only. The platform does not offer personalized financial, legal, or investment advice. Users should consult licensed professionals before acting on any information."
    },
    {
      title: "6. No Warranties",
      content: "Boogasi provides the platform and content “as-is.” We make no warranties, express or implied, regarding accuracy, completeness, or suitability of content."
    },
    {
      title: "7. Limitation of Liability",
      content: "Boogasi is not liable for any indirect or consequential damages arising from use of the platform or reliance on AI-generated content."
    },
    {
      title: "8. Indemnification",
      content: "Users agree to indemnify Boogasi against all claims arising from their use of the platform or breach of these Terms."
    },
    {
      title: "9. Variation",
      content: "Boogasi may update these Terms at any time. Continued use of the site indicates acceptance of any changes."
    },
    {
      title: "10. Assignment",
      content: "Boogasi may assign its rights and obligations. Users may not transfer their rights under these Terms without written permission."
    },
    {
      title: "11. Entire Agreement",
      content: "These Terms constitute the full agreement between Boogasi and the user, superseding all prior agreements."
    },
    {
      title: "12. Governing Law & Jurisdiction",
      content: "These Terms shall be governed by and interpreted in accordance with the laws of the State of Delaware, United States. You agree to submit to the non-exclusive jurisdiction of the state and federal courts located in Delaware for the resolution of any disputes."
    }
  ];

  return (
    <div className="page-container bg-gradient-to-br from-background to-muted/30 py-12 px-4 sm:px-6 lg:px-8 text-foreground">
      <div className="max-w-4xl mx-auto bg-card p-6 sm:p-8 lg:p-10 rounded-xl shadow-2xl border border-border/50">
        <h1 className="text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-pink-500">
          Terms and Conditions - Boogasi
        </h1>
        
        {terms.map((term, index) => (
          <section key={index} className="mb-8 last:mb-0">
            <h2 className="text-2xl font-semibold mb-3 text-primary/90">{term.title}</h2>
            {term.content.split('\n').map((paragraph, pIndex) => (
              <p key={pIndex} className="text-muted-foreground leading-relaxed mb-2 last:mb-0">
                {paragraph.startsWith('- ') ? (
                  <span className="ml-4 list-item list-disc">{paragraph.substring(2)}</span>
                ) : (
                  paragraph
                )}
              </p>
            ))}
          </section>
        ))}

        <div className="mt-12 text-center text-sm text-muted-foreground/80">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;