document.addEventListener('DOMContentLoaded', function () {
    // Get elements
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');
    const buttonContainer = document.getElementById('buttonContainer');
    const responseMessage = document.getElementById('responseMessage');

    // Generate Floating Leaves - Removed per user request

    // Opening Screen Logic
    const openingScreen = document.getElementById('opening-screen');
    const openBtn = document.getElementById('openBtn');
    const mainContainer = document.getElementById('mainContainer');

    openBtn.addEventListener('click', () => {
        openingScreen.classList.add('hidden');
        setTimeout(() => {
            openingScreen.style.display = 'none';
            mainContainer.classList.add('visible');

            // Initialize positions after Main Container is visible
            updateInitialPosition();

            // Move No button to body for full freedom, but keep it visually in place initially
            const noRect = noButton.getBoundingClientRect();
            noButton.style.position = 'fixed';
            noButton.style.left = `${noRect.left}px`;
            noButton.style.top = `${noRect.top}px`;
            noButton.style.width = `${noRect.width}px`; // Maintain width
            document.body.appendChild(noButton);

            noButtonPosition.x = noRect.left;
            noButtonPosition.y = noRect.top;
        }, 800);
    });

    // Variables for No button movement
    let noButtonPosition = { x: 0, y: 0 };
    let isMoving = false;

    // Initial State Check
    // CSS places it on the right. We capture that position.
    const updateInitialPosition = () => {
        const noRect = noButton.getBoundingClientRect();
        // Just storing it doesn't mean we set 'left' style yet. 
        // We will wait until first move to set strict 'left/top' styles.
        noButtonPosition.x = noRect.left;
        noButtonPosition.y = noRect.top;
    };

    // Call after layout
    setTimeout(updateInitialPosition, 100);

    // Set initial position - We don't random position initially anymore
    // We let CSS place it next to Yes button.
    const buttonRow = document.querySelector('.button-row');

    // Overlap detection helper (Global Coords)
    function isOverlapping(x, y) {
        const yesRect = yesButton.getBoundingClientRect();
        const noRect = noButton.getBoundingClientRect();

        // Target Rect (Predicted)
        const targetLeft = x;
        const targetTop = y;
        const targetRight = x + noRect.width;
        const targetBottom = y + noRect.height;

        // Yes Rect
        const yesLeft = yesRect.left;
        const yesTop = yesRect.top;
        const yesRight = yesRect.right;
        const yesBottom = yesRect.bottom;

        // Padding
        const pad = 20;

        return (
            targetLeft < yesRight + pad &&
            targetRight > yesLeft - pad &&
            targetTop < yesBottom + pad &&
            targetBottom > yesTop - pad
        );
    }

    function moveNoButton(targetX, targetY) {
        if (isMoving) return;
        isMoving = true;

        // Constrain to Window
        const maxX = window.innerWidth - noButton.offsetWidth - 20;
        const maxY = window.innerHeight - noButton.offsetHeight - 20;

        let safeX = Math.max(20, Math.min(targetX, maxX));
        let safeY = Math.max(20, Math.min(targetY, maxY));

        noButton.style.transition = 'all 0.4s ease-out';
        noButton.style.left = `${safeX}px`;
        noButton.style.top = `${safeY}px`;

        noButtonPosition.x = safeX;
        noButtonPosition.y = safeY;

        setTimeout(() => { isMoving = false; }, 400);
    }

    // Helper for sound (simplified)
    function playSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 300 + Math.random() * 200;
            gain.gain.value = 0.05;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) { }
    }

    // Trigger movement on hover
    const handleInteraction = (e) => {
        if (isMoving) return;

        // Bounding Box
        const noRect = noButton.getBoundingClientRect();
        const noCenterX = noRect.left + noRect.width / 2;
        const noCenterY = noRect.top + noRect.height / 2;

        const cursorX = e.clientX;
        const cursorY = e.clientY;

        // Vector away from cursor
        let dx = noCenterX - cursorX;
        let dy = noCenterY - cursorY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist = Math.sqrt(dx * dx + dy * dy); }

        // Large jump distance for "all over the place" feel
        const jumpDist = 300;

        let vectorX = (dx / dist) * jumpDist;
        let vectorY = (dy / dist) * jumpDist;

        // Add some randomness
        vectorX += (Math.random() - 0.5) * 100;
        vectorY += (Math.random() - 0.5) * 100;

        let targetX = noButtonPosition.x + vectorX;
        let targetY = noButtonPosition.y + vectorY;

        // Bounds check & Overlap Check Loop
        const maxX = window.innerWidth - noButton.offsetWidth;
        const maxY = window.innerHeight - noButton.offsetHeight;
        const clamp = (v, max) => Math.max(10, Math.min(v, max - 10));

        let finalX = clamp(targetX, maxX);
        let finalY = clamp(targetY, maxY);

        // If overlap, try random positions until safe
        let attempts = 0;
        while (isOverlapping(finalX, finalY) && attempts < 20) {
            finalX = Math.random() * maxX;
            finalY = Math.random() * maxY;
            attempts++;
        }

        moveNoButton(finalX, finalY);
        playSound();
    };

    noButton.addEventListener('mouseenter', handleInteraction);

    // No button click
    let noButtonClickCount = 0;
    noButton.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        noButtonClickCount++;

        handleInteraction(e); // Run away!
    });

    // Yes button functionality
    yesButton.addEventListener('click', function () {
        // Hide "asking" text immediately
        const directionText = document.getElementById('directionText');

        if (directionText) directionText.style.display = 'none';

        // Hide No button immediately
        if (noButton) noButton.style.display = 'none';

        // Create a subtle confetti effect
        createConfettiEffect();

        // Play a positive sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a pleasant chime sound
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                }, index * 150);
            });
        } catch (error) {
            console.log("Audio not supported");
        }

        // Proceed to next screen immediately with fade out
        setTimeout(() => {
            buttonContainer.style.opacity = '0';
            buttonContainer.style.transform = 'translateY(20px)';

            setTimeout(() => {
                buttonContainer.style.display = 'none';
                responseMessage.style.display = 'block';

                // Scroll to response
                responseMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }, 100); // 100ms small delay just to let sound start
    });

    // Create confetti effect
    function createConfettiEffect() {
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '1000';
        document.body.appendChild(confettiContainer);

        const confettiColors = ['#228B22', '#2E8B57', '#3CB371', '#90EE90', '#98FB98'];
        const confettiShapes = ['🌸', '🌺', '🌼', '🌻', '🌹', '🥀', '💐', '🌷', '🌱', '🍃'];

        for (let i = 0; i < 40; i++) {
            const confetti = document.createElement('div');
            confetti.innerHTML = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
            confetti.style.position = 'absolute';
            confetti.style.left = '50%';
            confetti.style.top = '50%';
            confetti.style.fontSize = '20px';
            confetti.style.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.opacity = '0.8';
            confettiContainer.appendChild(confetti);

            // Animate confetti
            const angle = Math.random() * Math.PI * 2;
            const velocity = 1.5 + Math.random() * 2;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            let x = 0;
            let y = 0;
            let opacity = 0.8;
            let rotation = 0;
            const rotationSpeed = Math.random() * 10 - 5;

            const animateConfetti = () => {
                x += vx;
                y += vy;
                vy += 0.05; // gravity
                opacity -= 0.01;
                rotation += rotationSpeed;

                confetti.style.transform = `translate(${x}rem, ${y}rem) rotate(${rotation}deg)`;
                confetti.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animateConfetti);
                } else {
                    confetti.remove();
                }
            };

            requestAnimationFrame(animateConfetti);
        }

        // Remove container after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 2000);
    }


});
