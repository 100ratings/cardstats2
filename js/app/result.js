$(document).ready(function(){
    // Probabilidades fixas fornecidas pelo usuário (em porcentagem)
    const FIXED_PROBABILITIES = {
        "S": [5.33, 1.78, 2.49, 1.78, 1.78, 1.78, 2.84, 1.77, 1.95, 2.31, 3.20, 4.44, 3.55],
        "H": [5.33, 1.78, 2.49, 1.78, 1.78, 1.78, 2.84, 1.77, 1.95, 2.31, 3.20, 4.44, 3.55],
        "C": [2.29, 0.76, 1.07, 0.76, 0.76, 0.76, 1.22, 0.76, 0.83, 0.99, 1.37, 1.90, 1.52],
        "D": [2.29, 0.76, 1.07, 0.76, 0.76, 0.76, 1.22, 0.76, 0.83, 0.99, 1.37, 1.90, 1.52]
    };

    showResults();

    function getP(card, suit) {
        const STACK = ["4C","2H","7D","3C","4H","6D","AS","5H","9S","2S","QH","3D","QC","8H","6S","5S","9H","KC","2D","JH","3S","8S","6H","10C","5D","KD","2C","3H","8D","5C","KS","JD","8C","10S","KH","JC","7S","10H","AD","4S","7H","4D","AC","9C","JS","QD","7C","QS","10D","6C","AH","9D"];
        const posMap = {}; STACK.forEach((c, i) => posMap[c] = i + 1);
        var cardNames = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var suitNames = ["S", "H", "C", "D"];
        var target = cardNames[card] + suitNames[suit];
        return posMap[target] || 1;
    }

    function seededRandom(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function showResults() {
        var card = parseInt(getParamValue("card")) || 0;
        var suit = parseInt(getParamValue("suit")) || 0;
        var n = parseInt(getParamValue("pos")) || 1;
        
        var p = getP(card, suit);
        var cut = ((p - n % 52) + 52) % 52;
        var k = cut === 0 ? 52 : cut;
        
        var cardShort = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var suitSymbols = ["&spades;", "&hearts;", "&clubs;", "&diams;"];
        var suitNames = ["S", "H", "C", "D"];
        var colors = ["black", "red", "black", "red"];
        
        var targetOdds = 2700 + k;
        
        // 1) Obter a probabilidade fixa da carta selecionada
        var cardFixedPerc = FIXED_PROBABILITIES[suitNames[suit]][card];
        var finalCardOdds = 100 / cardFixedPerc;

        // 2) Calcular a probabilidade da posição para atingir o ALVO
        var finalPosOdds = targetOdds / finalCardOdds;
        
        var cardPerc = (100 / finalCardOdds).toFixed(2);
        var posPerc = (100 / finalPosOdds).toFixed(2);

        // 3) Tamanho da amostra dinâmico (mais realista)
        // Base 145.000 + (dias desde 01/01/2026 * 50) + variação aleatória
        var now = new Date();
        var start = new Date(2026, 0, 1);
        var diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        var dailyIncrease = diffDays * 50;
        var seedBase = (card * 1000) + (suit * 100) + n;
        var sampleSize = 145000 + dailyIncrease + Math.floor(seededRandom(seedBase) * 5000);
        
        $("#sampleSize").text(sampleSize.toLocaleString('pt-BR'));
        $("#cardLabel").html(cardShort[card] + suitSymbols[suit]);
        $("#cardLabel").css("color", colors[suit]);
        $("#cardOddsValue").text("1 em " + finalCardOdds.toFixed(2).replace('.', ',') + " (≈" + cardPerc.replace('.', ',') + "%)");
        
        $("#posLabel").text("#" + n);
        $("#posOddsValue").text("1 em " + finalPosOdds.toFixed(2).replace('.', ',') + " (≈" + posPerc.replace('.', ',') + "%)");
        
        $("#combinedOdds").html("<b>1 em " + targetOdds.toLocaleString('pt-BR') + "</b>");

        if (window.spinner) window.spinner.stop();
        var kStr = k.toString().padStart(2, '0');
        sendToWebhook(kStr);
        renderCharts(card, suit, n, seedBase);
    }

    function renderCharts(card, suit, n, seedBase) {
        // Array com as 52 cartas em ordem: Espadas (0-12), Copas (13-25), Paus (26-38), Ouros (39-51)
        var cardsData = [];
        var suitNames = ["S", "H", "C", "D"];
        
        // Preencher dados das cartas com as probabilidades fixas
        suitNames.forEach(s => {
            FIXED_PROBABILITIES[s].forEach(p => {
                cardsData.push(p);
            });
        });

        // Preencher dados das posições (aleatório leve em torno de 1.92% que é 1/52)
        var positionsData = [];
        for (var i = 0; i < 52; i++) {
            positionsData.push(1.8 + (seededRandom(seedBase + i + 100) * 0.25));
        }

        var ticks = new Array(52), pticks = new Array(52), selCardSeries = new Array(52), selPosSeries = new Array(52);
        
        // Inicializar arrays vazios
        for (var x = 0; x < 52; x++) {
            ticks[x] = ""; 
            pticks[x] = ""; 
            selCardSeries[x] = 0; 
            selPosSeries[x] = 0;
        }
        
        // Adicionar apenas a letra "A" na posição da carta selecionada
        var cardIdx = (suit * 13) + card;
        ticks[cardIdx] = "A";
        
        // Adicionar símbolos dos naipes para orientação
        ticks[6] = "♠"; 
        ticks[19] = "<font color='red'>♥</font>";
        ticks[32] = "♣"; 
        ticks[45] = "<font color='red'>♦</font>";
        
        // Eixo X para posições
        pticks[0] = "1"; pticks[12] = "13"; pticks[25] = "26"; pticks[38] = "39"; pticks[51] = "52";

        // O traço vermelho deve estar na carta selecionada (cardIdx)
        selCardSeries[cardIdx] = cardsData[cardIdx];
        cardsData[cardIdx] = 0;

        // O traço vermelho deve estar na posição selecionada
        var posIdx = n - 1;
        selPosSeries[posIdx] = positionsData[posIdx];
        positionsData[posIdx] = 0;

        var commonOptions = {
            stackSeries: true,
            seriesDefaults: {
                renderer: $.jqplot.BarRenderer,
                rendererOptions: { fillToZero: true, barWidth: 3, shadow: false }
            },
            series: [{ label: " " }, { label: " ", color: "#FF0000" }],
            axes: {
                xaxis: { renderer: $.jqplot.CategoryAxisRenderer, showTicks: true },
                yaxis: { showTicks: false, pad: 0 }
            },
            grid: { drawGridLines: false, background: '#FFFDF6', borderWeight: 0, shadow: false }
        };

        var cardChart = $.jqplot('chart1', [cardsData, selCardSeries], $.extend(true, {}, commonOptions, {
            axes: { xaxis: { ticks: ticks } }
        }));

        var posChart = $.jqplot('chart2', [positionsData, selPosSeries], $.extend(true, {}, commonOptions, {
            axes: { xaxis: { ticks: pticks } }
        }));

        $(window).resize(function() {
            cardChart.replot({ resetAxes: true });
            posChart.replot({ resetAxes: true });
        });
    }

    function sendToWebhook(value) {
        $.ajax({
            url: "https://www.11z.co/_w/5156/selection",
            type: "POST",
            data: JSON.stringify({ "value": value }),
            contentType: "application/json"
        });
    }

    function getParamValue(name) {
        if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
            return decodeURIComponent(name[1]);
    }

    function spin() {
        var s = new Spinner({
            lines: 13, length: 15, width: 5, radius: 20, corners: 1, rotate: 0, direction: 1,
            color: '#000', speed: 1, trail: 60, shadow: false, hwaccel: false,
            className: 'spinner', zIndex: 2e9, top: '50%', left: '50%'
        }).spin(document.getElementById('tbody'));
        window.spinner = s;
        return s;
    }
});
