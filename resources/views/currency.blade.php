<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
    <script src="https://unpkg.com/typewriter-effect@latest/dist/core.js"></script>
    <title>CoinPrice</title>
</head>
<style>
    body {
        background-color: #191231;
        text-align: center;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
    }

    .border-text-black:hover {
        text-shadow: 4px 0 0 rgb(0, 0, 0), -4px 0 0 rgb(0, 0, 0), 0 4px 0 rgb(0, 0, 0), 0 -4px 0 rgb(0, 0, 0), 1px 1px rgb(0, 0, 0), -1px -1px 0 rgb(0, 0, 0), 1px -1px 0 rgb(0, 0, 0), -1px 1px 0 rgb(0, 0, 0);
        transition: text-shadow 0.2s ease-in-out;
    }

    .border-text-black {
        text-shadow: none;
        transition: text-shadow 0.2s ease-in-out;
    }


    #sun,
    .prices {
        margin: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 0;
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
    }

    .font-pixel {
        font-family: 'pixel', Arial;

    }

    .font-pixel:hover {
        cursor: pointer;
    }

    @font-face {
        font-family: 'pixel';
        src: url('/fonts/upheavtt.ttf') format('truetype')
    }


    /* /* #title {
        background: url('/assets/coinprice-light.png') no-repeat;
         background-size: cover; 
    }

    #title:hover {
        background: url('/assets/coinprice.png') no-repeat; 
    } */

    .bg-dark {
        background-color: #191231
    }

</style>

<body class="text-white">
    <a href="{{ route('crypto.currency') }}">
        <p class="mt-4 mr-2 text-6xl text-white animate__fadeInDown animate__animated font-pixel" id="mainTitle"></p>
    </a>
    <div class="items-center justify-center w-11/12 m-auto lg:flex prices" style="z-index: 9999">
        <div class="flex lg:space-x-20 md:space-x-10">
            <div class="flex-1 m-auto mt-24 md:mt-0 animate__fadeIn animate__animated animate__delay-1s">
                <img src="{{ asset('assets/btc.png') }}" class="w-16 h-16 m-auto" alt="bitcoinIcon">
                <h2 class="text-2xl text-center font-pixel border-text-black">Bitcoin</h2>
                <input data-price="{{ $prices[0] }}" type="text" id="bitcoinPrice" placeholder="Prix en euro"
                    class="w-2/3 px-2 py-1 text-center bg-transparent border-2 border-white rounded lg:w-full font-pixel focus:outline-none">
                <p id="bitcoinResult" class="text-2xl font-pixel"></p>
            </div>
            <div class="flex-1 m-auto mt-8 md:mt-0 animate__fadeIn animate__delay-1s animate__animated">
                <img src="{{ asset('assets/eth.png') }}" class="w-16 h-16 m-auto" alt="ethereumIcon">
                <h2 class="text-2xl text-center font-pixel border-text-black">Ethereum</h2>
                <input type="text" data-price="{{ $prices[1] }}" id="ethPrice" placeholder="Prix en euro"
                    class="w-2/3 px-2 py-1 text-center bg-transparent border-2 rounded lg:w-full font-pixel focus:outline-none">
                <p id="ethereumResult" class="text-2xl font-pixel"></p>

            </div>
        </div>
        <div class="lg:space-x-20 md:space-x-10 lg:flex">
            <div
                class="flex-1 m-auto mt-8 lg:ml-20 md:ml-12 md:mt-0 animate__fadeIn animate__delay-1s animate__animated">
                <img src="{{ asset('assets/bnb.png') }}" class="h-16 m-auto " alt="bnbIcon">

                <h2 class="text-2xl text-center ml font-pixel border-text-black">BNB Binance</h2>
                <input data-price="{{ $prices[2] }}" type="text" id="bnbPrice" placeholder="Prix en euro"
                    class="w-2/3 px-2 py-1 text-center bg-transparent border-2 rounded lg:w-full md:w-1/2 font-pixel focus:outline-none">
                <p id="bnbResult" class="text-2xl font-pixel"></p>

            </div>
            <div class="flex-1 m-auto mt-8 md:mt-0 animate__fadeIn animate__delay-1s animate__animated">
                <img src="{{ asset('assets/solana.png') }}" class="w-16 h-16 m-auto" alt="solanaIcon">

                <h2 class="text-2xl text-center font-pixel border-text-black">Solana </h2>
                <input type="text" data-price="{{ $prices[3] }}" id="solPrice" placeholder="Prix en euro"
                    class="w-2/3 px-2 py-1 text-center bg-transparent border-2 rounded lg:w-full md:w-1/2 font-pixel focus:outline-none">
                <p id="solResult" class="text-2xl font-pixel"></p>


            </div>
        </div>

    </div>
    <div style="z-index : -20;">
        <canvas id="sun" width="512" class="z-0 animate__fadeIn animate__animated" height="512">
            Reload the page
        </canvas>
    </div>


</body>

<script src="{{ asset('js/sun.js') }}"></script>

<script>
    var app = document.getElementById('mainTitle');
    let bitcoinPrice = document.getElementById('bitcoinPrice');
    let ethereumPrice = document.getElementById('ethPrice');
    let bnbPrice = document.getElementById('bnbPrice');
    let solanaPrice = document.getElementById('solPrice');


    var typewriter = new Typewriter(app, {
        loop: true,
        cursor: ''
    });

    typewriter
        .typeString('CoinPrice')
        .pauseFor(5000)
        .start()



    bitcoinPrice.addEventListener('keyup', function() {
        document.getElementById('bitcoinResult').innerHTML = parseFloat(bitcoinPrice.value / bitcoinPrice
            .dataset.price).toFixed(6) + " BTC";
    }, false)

    ethereumPrice.addEventListener('keyup', function() {
        document.getElementById('ethereumResult').innerHTML = parseFloat(ethereumPrice.value / ethereumPrice
            .dataset.price).toFixed(6) + " ETH";
    }, false)

    bnbPrice.addEventListener('keyup', function() {
        document.getElementById('bnbResult').innerHTML = parseFloat(bnbPrice.value / bnbPrice
            .dataset.price).toFixed(6) + " BNB";
    }, false)

    solanaPrice.addEventListener('keyup', function() {
        document.getElementById('solResult').innerHTML = parseFloat(solanaPrice.value / solanaPrice
            .dataset.price).toFixed(6) + " SOL";
    }, false)
</script>

</html>
