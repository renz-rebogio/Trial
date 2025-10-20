import React from "react";
    import VerificationManagement from "@/components/admin/VerificationManagement";
    import { Helmet } from 'react-helmet-async';
    
    const AdminDashboardPage = () => {
        return (
            <>
                <Helmet>
                    <title>Admin Dashboard | Boogasi</title>
                    <meta name="description" content="Manage user verifications and other administrative tasks on the Boogasi platform." />
                    <meta property="og:title" content="Admin Dashboard | Boogasi" />
                    <meta property="og:description" content="Manage user verifications and other administrative tasks on the Boogasi platform." />
                </Helmet>
                <div className="min-h-screen bg-background text-foreground brighter-theme-area">
                    <div className="container mx-auto px-4 py-8">
                        <header className="mb-8">
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                Admin Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Central hub for managing platform operations.
                            </p>
                        </header>
    
                        <main>
                            <VerificationManagement />
                        </main>
                    </div>
                </div>
            </>
        );
    };
    
    export default AdminDashboardPage;