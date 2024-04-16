'use client'

function Modal({ children, onClose }) {
    // Handler for backdrop clicks
    const handleBackdropClick = (event) => {
        onClose();  // Call the onClose function passed as a prop
    };

    // Prevent modal content clicks from closing the modal
    const handleModalContentClick = (event) => {
        event.stopPropagation();  // Stop click from bubbling up to the backdrop
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content" onClick={handleModalContentClick}>
                <button onClick={onClose} className="close-button">Close</button>
                {children}
            </div>
            <style jsx>{`
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    position: relative;
                }
                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                }
            `}</style>
        </div>
    );
}


export default Modal;
