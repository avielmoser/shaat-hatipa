import "../globals.css";

export const metadata = {
    title: 'Admin Dashboard - ShaatHaTipa',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
                {children}
            </body>
        </html>
    );
}
