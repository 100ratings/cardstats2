$(document).ready(function(){
    // Probabilidades fixas das cartas (em porcentagem)
    const FIXED_PROBABILITIES = {
        "S": [8.427, 1.453, 2.509, 1.255, 1.454, 1.321, 2.906, 1.322, 1.387, 2.245, 3.038, 4.226, 3.434],
        "H": [6.637, 1.404, 2.425, 1.213, 1.405, 1.280, 2.791, 1.281, 1.343, 2.156, 2.928, 6.210, 3.328],
        "C": [2.726, 0.897, 1.548, 0.779, 0.898, 0.816, 1.793, 0.817, 0.857, 1.387, 1.877, 2.611, 2.108],
        "D": [2.853, 0.885, 1.528, 0.771, 0.886, 0.809, 1.772, 0.810, 0.849, 1.376, 1.865, 2.597, 2.094]
    };

    // Nova lista de probabilidades de posições (1-52)
    const POSITION_PROBABILITIES = [
        2.850, 2.090, 5.200, 1.790, 2.760, 1.750, 11.900, 2.390, 2.470, 2.680, 2.610, 2.540, 6.400, // 1-13
        1.510, 1.880, 1.830, 3.700, 1.710, 1.670, 1.630, 4.800, 1.980, 3.450, 1.590, 2.330, 1.550, // 14-26
        0.640, 0.620, 0.600, 2.270, 0.580, 0.560, 0.540, 0.520, 0.500, 0.485, 2.210, 0.450, 1.930, // 27-39
        2.150, 0.435, 3.150, 0.420, 0.405, 0.390, 0.375, 0.360, 0.345, 0.335, 0.325, 0.315, 2.030  // 40-52
    ];

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
        
        // Lógica do Corte (k)
        var p = getP(card, suit);
        var cut = ((p - n % 52) + 52) % 52;
        var k = cut === 0 ? 52 : cut;
        
        // O ALVO é sempre 2700 + k (2.7XX)
        var targetOdds = 2700 + k;
        
        var cardShort = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var suitSymbols = ["&spades;", "&hearts;", "&clubs;", "&diams;"];
        var suitNames = ["S", "H", "C", "D"];
        var colors = ["black", "red", "black", "red"];
        
        // 1) Obter a probabilidade fixa da carta selecionada
        var cardFixedPerc = FIXED_PROBABILITIES[suitNames[suit]][card];
        var finalCardOdds = 100 / cardFixedPerc;

        // 2) Calcular a probabilidade da posição para atingir o ALVO
        // finalCardOdds * finalPosOdds = targetOdds  =>  finalPosOdds = targetOdds / finalCardOdds
        var finalPosOdds = targetOdds / finalCardOdds;
        var posPerc = (100 / finalPosOdds);

        // Tamanho da amostra dinâmico
        var now = new Date();
        var start = new Date(2026, 0, 1);
        var diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        var dailyIncrease = diffDays * 50;
        var seedBase = (card * 1000) + (suit * 100) + n;
        var sampleSize = 145000 + dailyIncrease + Math.floor(seededRandom(seedBase) * 5000);
        
        $("#sampleSize").text(sampleSize.toLocaleString('pt-BR'));
        $("#cardLabel").html(cardShort[card] + suitSymbols[suit]);
        $("#cardLabel").css("color", colors[suit]);
        
        // Formatar com exatamente 2 casas decimais (XX,XX)
        var cardOddsFormatted = finalCardOdds.toFixed(2).replace('.', ',');
        var posOddsFormatted = finalPosOdds.toFixed(2).replace('.', ',');
        
        $("#cardOddsValue").text("1 em " + cardOddsFormatted + " (≈" + cardFixedPerc.toFixed(2).replace('.', ',') + "%)");
        
        $("#posLabel").text("#" + n);
        $("#posOddsValue").text("1 em " + posOddsFormatted + " (≈" + posPerc.toFixed(2).replace('.', ',') + "%)");
        
        // O Alvo exibido
        $("#combinedOdds").html("<b>1 em " + targetOdds.toLocaleString('pt-BR') + "</b>");

        if (window.spinner) window.spinner.stop();
        
        renderCharts(card, suit, n, posPerc);
    }

    function renderCharts(card, suit, n, calculatedPosPerc) {
        var cardsData = [];
        var suitNames = ["S", "H", "C", "D"];
        
        // Gráfico 1: Probabilidades fixas das cartas
        suitNames.forEach(s => {
            FIXED_PROBABILITIES[s].forEach(p => {
                cardsData.push(p);
            });
        });

        // Gráfico 2: Probabilidades fixas das posições
        var positionsData = [...POSITION_PROBABILITIES];

        var ticks = new Array(52), pticks = new Array(52), selCardSeries = new Array(52), selPosSeries = new Array(52);
        
        for (var x = 0; x < 52; x++) {
            ticks[x] = ""; 
            pticks[x] = ""; 
            selCardSeries[x] = 0; 
            selPosSeries[x] = 0;
        }
        
        ticks[0] = "A";    
        ticks[13] = "A";   
        ticks[26] = "A";   
        ticks[39] = "A";   
        
        ticks[6] = "♠"; 
        ticks[19] = "<font color='red'>♥</font>";
        ticks[32] = "♣"; 
        ticks[45] = "<font color='red'>♦</font>";
        
        pticks[0] = "1"; pticks[12] = "13"; pticks[25] = "26"; pticks[38] = "39"; pticks[51] = "52";

        // Destaque da Carta
        var cardIdx = (suit * 13) + card;
        selCardSeries[cardIdx] = cardsData[cardIdx];
        cardsData[cardIdx] = 0;

        // Destaque da Posição (usa o valor calculado para o gráfico)
        var posIdx = n - 1;
        selPosSeries[posIdx] = calculatedPosPerc;
        positionsData[posIdx] = 0;

        var commonOptions = {
            stackSeries: true,
            seriesDefaults: {
                renderer: $.jqplot.BarRenderer,
                rendererOptions: { fillToZero: true, barWidth: 3, shadow: false }
            },
            series: [{ label: " ", color: "#78CDDD" }, { label: " ", color: "#FF3B3B" }],
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

    function getParamValue(name) {
        if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
            return decodeURIComponent(name[1]);
    }
});
