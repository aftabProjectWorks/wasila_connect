import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Wasila',
  description: 'Wasila Connect',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Wasila</h1>
              <nav>
                <a className="text-sm text-blue-600" href="/auth/login">Log in</a>
              </nav>
            </div>
          </header>
          <main className="max-w-4xl mx-auto p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
