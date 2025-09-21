import { type AppType } from "next/app";
import { Geist } from "next/font/google";
import { useEffect, useState } from "react";

import { api } from "@/utils/api";

import "@/styles/globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

const geist = Geist({
	subsets: ["latin"],
});

const MyApp: AppType = ({ Component, pageProps }) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<AuthProvider>
		<div className={geist.className}>
			    <Toaster position="top-right" richColors />
			<Component {...pageProps} />
		</div>
		</AuthProvider>
	);
};

export default api.withTRPC(MyApp);
