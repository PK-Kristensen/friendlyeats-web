// app/api/session.js
import { auth as adminAuth } from '@/src/lib/firebase/firebaseAdmin'; // Assume this is initialized Firebase Admin SDK

export default async (req, res) => {
  if (req.method === 'POST') {
    const idToken = req.body.idToken; // You'd send this from the client after successful signInWithGoogle
    try {
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // Example: 5 days
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      
      // Set the cookie in the response
      const options = { maxAge: expiresIn, httpOnly: true, secure: true /* Consider setting 'sameSite' as well */ };
      res.cookie('__session', sessionCookie, options);
      
      res.status(200).send({ status: 'success' });
    } catch (error) {
      res.status(401).send({ error: 'Failed to create session cookie' });
    }
  } else {
    // Handle other request methods or return an error
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
