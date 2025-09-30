window.onload = () => {
    const minuteHand = document.getElementById('minute-hand');
    const hourHand = document.getElementById('hour-hand');
    const secondHand = document.getElementById('second-hand');

    setInterval(() => {

        const date = new Date();
        const seconds = date.getSeconds() / 60;
        const minutes = (seconds + date.getMinutes()) / 60;
        const hours = (minutes + date.getHours()) / 12;
    
        rotateClockHand(secondHand, seconds);
        rotateClockHand(minuteHand, minutes);
        rotateClockHand(hourHand, hours);

        if (date.getMinutes() % 10 === 0 && date.getSeconds() === 0) {
            playSpookySound();
        }

    }, 1000);
    balls = document.getElementsByClassName("ball");
    document.onmousemove = function(){
        //horizontal coordinate (x) of the cursor
        let x = event.clientX * 100 / window.innerWidth + "%";
        //vertical coordinate (y) of the cursor
        let y = event.clientY * 100 / window.innerHeight + "%";
        
        for(let i=0;i<2;i++){
            balls[i].style.left = x;
            balls[i].style.top = y;
            balls[i].style.transform = "translate(-"+x+",-"+y+")"*2;
        }
    }

    const audios = [
        new Audio("eerie-sound1.mp3"),
        new Audio("eerie-sound2.mp3"),
        new Audio("eerie-sound3.mp3"),
        new Audio("eerie-sound4.mp3"),
        new Audio("eerie-sound5.mp3"),
        new Audio("eerie-sound6.mp3")
    ];

    let play = document.getElementById("play");
    play.addEventListener("click", playSpookySound);

    function playSpookySound() {
        const randIndex = Math.floor(Math.random() * audios.length);
        const chosenAudio = audios[randIndex];
        chosenAudio.play();
    }
    function numberrandomizer() {
        let randnum = Math.floor(Math.random() * 6) + 1;
    }
}

function rotateClockHand(element, rotation) {
    element.style.setProperty('--rotate', rotation * 360);
}

