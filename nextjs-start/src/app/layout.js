import './globals.css'
import Header from "../components/Header";
import { getAuthenticatedAppForUser } from "../../src/lib/firebase/firebase";
import { inter } from './fonts';

// Force next.js to treat this route as server-side rendered
// Without this line, during the build process, next.js will treat this route as static and build a static HTML file for it
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Yes Event",
  description:
    "Yes! Eventmanagement is quick, easy, and fun with YesEvent.",
};

export default async function RootLayout({ children }) {
  const { currentUser } = await getAuthenticatedAppForUser();

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Header initialUser={currentUser?.toJSON()} />
        <main>{children}</main>
      </body>
    </html>
  );
}
