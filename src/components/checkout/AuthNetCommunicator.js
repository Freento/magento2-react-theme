import React, { useEffect } from 'react';
import '../../styles/checkout/AuthNetCommunicator.less';

const AuthNetCommunicator = () => {
    useEffect(() => {
        const parseQueryString = (str) => {
            const params = {};
            const pairs = str.replace(/^\?/, '').replace(/^#/, '').split('&');

            for (const pair of pairs) {
                if (pair) {
                    const [key, value] = pair.split('=');
                    if (key) {
                        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
                    }
                }
            }
            return params;
        };

        const sendMessageToParent = (data) => {
            const targets = [
                { target: window.parent, name: 'parent' },
                { target: window.parent?.parent, name: 'parent.parent' },
                { target: window.top, name: 'top' }
            ];

            let messageSent = false;

            for (const { target, name } of targets) {
                if (target && target !== window) {
                    try {
                        target.postMessage(data, window.location.origin);
                        messageSent = true;
                    } catch (e) {
                        console.log(`🔧 Failed to send message to ${name}:`, e);
                    }
                }
            }

            if (!messageSent) {
                console.error('🔧 Could not send message to any parent window');
            }
        };

        // Handle hash-based communication (from URL)
        if (window.location.hash && window.location.hash.length > 1) {
            const hashData = parseQueryString(window.location.hash.substring(1));
            sendMessageToParent(hashData);
        }

        // Handle search param-based communication
        if (window.location.search && window.location.search.length > 1) {
            const searchData = parseQueryString(window.location.search.substring(1));
            sendMessageToParent(searchData);
        }

        // Listen for messages from Authorize.Net
        const handleMessage = (event) => {
            // Only process messages from Authorize.Net
            if (event.origin.includes('authorize.net')) {
                sendMessageToParent(event.data);
            }
        };

        // Add message listener
        window.addEventListener('message', handleMessage);

        // If no hash or search params, send a ping
        if (!window.location.hash && !window.location.search) {
            sendMessageToParent({ action: 'ping' });
        }

        // Cleanup
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div className="authnet-communicator">
            <div className="authnet-communicator__icon">🔒</div>
            <h3 className="authnet-communicator__title">
                Secure Payment Communication
            </h3>
            <p className="authnet-communicator__text">
                This page handles secure communication between the payment form and your checkout page.
            </p>
            <p className="authnet-communicator__note">
                If you see this page, the communication handler is working correctly.
            </p>
        </div>
    );
};

export default AuthNetCommunicator;