"use client";
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "@/components/Footer";

const ClientSideLayout = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div>Loading...</div>;

    return (
        <div className={`flex flex-col min-h-screen bg-white text-black`}>
            {/* Header */}
            <Header />
            {/* Main Content */}
            <main className={`flex-grow py-7 px-9 bg-white text-black`}>
                {children}
            </main>
            {/* Footer */}
            <Footer />
        </div>
    );
};

const ClientSideWrapper = ({ children }: { children: React.ReactNode }) => {
    return <ClientSideLayout>{children}</ClientSideLayout>;
};

export default ClientSideWrapper;
