import { useEffect } from 'react';

/**
 * Custom hook that triggers a callback when a click is detected outside of the specified ref.
 * @param {React.RefObject} ref - The ref of the element to detect outside clicks for.
 * @param {Function} callback - The function to call when an outside click is detected.
 */
export const useOutsideClick = (ref, callback) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
};
