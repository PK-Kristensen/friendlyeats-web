// AuthControls.js
import React, { useState } from "react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } from "../../../lib/firebase/auth";
import UserDropdown from './UseDropdown';
import Modal from '../../Modal';

const AuthControls = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleSignIn = async () => {
    if (isSignUp) {
      await signUpWithEmail(email, password);
    } else {
      await signInWithEmail(email, password);
    }
    setShowModal(false);  // Close the modal on successful sign in or sign up
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
  };

  if (user) {
    return <UserDropdown user={user} onSignOut={signOut} />;
  } else {
    return (
      <>
        <button onClick={toggleModal} className="bg-[#4285F4] text-white rounded px-4 py-2">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        {showModal && (
          <Modal onClose={toggleModal}>
            <form className="space-y-4">
              <input type="email" value={email} onChange={handleEmailChange} placeholder="Email" className="w-full p-2 border border-gray-300 rounded" />
              <input type="password" value={password} onChange={handlePasswordChange} placeholder="Password" className="w-full p-2 border border-gray-300 rounded" />
              <div className="flex justify-between items-center">
                <button onClick={handleSignIn} className="bg-[#4285F4] text-white rounded px-4 py-2">
                  {isSignUp ? 'Create Account' : 'Log In'}
                </button>
                <button type="button" onClick={signInWithGoogle} className="bg-red-500 text-white rounded px-4 py-2">Sign In with Google</button>
              </div>
              <button type="button" onClick={toggleSignUp} className="text-blue-500 underline">
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </form>
          </Modal>
        )}
      </>
    );
  }
};

export default AuthControls;
