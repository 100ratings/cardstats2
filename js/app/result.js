$(document).ready(function(){
    // Novas probabilidades fixas das cartas (em porcentagem)
    const FIXED_PROBABILITIES = {
        "S": [8.427, 1.453, 2.509, 1.255, 1.454, 1.321, 2.906, 1.322, 1.387, 2.245, 3.038, 4.226, 3.434],
        "H": [6.637, 1.404, 2.425, 1.213, 1.405, 1.280, 2.791, 1.281, 1.343, 2.156, 2.928, 6.210, 3.328],
        "C": [2.726, 0.897, 1.548, 0.779, 0.898, 0.816, 1.793, 0.817, 0.857, 1.387, 1.877, 2.611, 2.108],
        "D": [2.853, 0.885, 1.528, 0.771, 0.886, 0.809, 1.772, 0.810, 0.849, 1.376, 1.865, 2.597, 2.094]
    };

    // Novas probabilidades estimadas para posições 1-52
    const POSITION_PROBABILITIES = [
        2.934, 1.462, 6.178, 0.584, 1.318, 0.612, 12.648, 0.846, 0.792, 2.156, 2.012, 1.886, 4.578, // 1-13
        0.566, 0.548, 0.532, 3.212, 0.512, 0.496, 0.478, 4.214, 1.772, 3.086, 0.462, 0.448, 0.436, // 14-26
        0.424, 0.414, 0.404, 0.394, 0.386, 0.378, 0.370, 0.362, 0.354, 0.346, 0.338, 0.332, 0.326, // 27-39
        0.320, 0.314, 2.604, 0.308, 0.304, 0.300, 0.296, 0.292, 0.288, 0.284, 0.280, 0.276, 0.272  // 40-52
    ];

    showResults();

    function seededRandom(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function showResults() {
        var card = parseInt(getParamValue("card")) || 0;
        var suit = parseInt(getParamValue("suit")) || 0;
        var n = parseInt(getParamValue("pos")) || 1;
        
        var cardShort = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var suitSymbols = ["&spades;", "&hearts;", "&clubs;", "&diams;"];
        var suitNames = ["S", "H", "C", "D"];
        var colors = ["black", "red", "black", "red"];
        
        // 1) Obter a probabilidade fixa da carta selecionada
        var cardFixedPerc = FIXED_PROBABILITIES[suitNames[suit]][card];
        var finalCardOdds = 100 / cardFixedPerc;

        // 2) Obter a probabilidade fixa da posição selecionada
        var posIdx = n - 1;
        if (posIdx < 0) posIdx = 0;
        if (posIdx > 51) posIdx = 51;
        var posFixedPerc = POSITION_PROBABILITIES[posIdx];
        var finalPosOdds = 100 / posFixedPerc;
        
        // 3) Calcular Probabilidade Estimada (Multiplicação)
        // Exemplo: 40,16 * 67,63 = 2716,0208 -> Arredondar para 2716
        var rawTargetOdds = finalCardOdds * finalPosOdds;
        var targetOdds = Math.round(rawTargetOdds);
        
        var cardPerc = cardFixedPerc.toFixed(2);
        var posPerc = posFixedPerc.toFixed(2);

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
        
        $("#cardOddsValue").text("1 em " + cardOddsFormatted + " (≈" + cardPerc.replace('.', ',') + "%)");
        
        $("#posLabel").text("#" + n);
        $("#posOddsValue").text("1 em " + posOddsFormatted + " (≈" + posPerc.replace('.', ',') + "%)");
        
        $("#combinedOdds").html("<b>1 em " + targetOdds.toLocaleString('pt-BR') + "</b>");

        if (window.spinner) window.spinner.stop();
        
        renderCharts(card, suit, n);
    }

    function renderCharts(card, suit, n) {
        var cardsData = [];
        var suitNames = ["S", "H", "C", "D"];
        
        // Preencher dados das cartas com as probabilidades fixas
        suitNames.forEach(s => {
            FIXED_PROBABILITIES[s].forEach(p => {
                cardsData.push(p);
            });
        });

        // Preencher dados das posições com os valores fixos fornecidos
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

        var cardIdx = (suit * 13) + card;
        selCardSeries[cardIdx] = cardsData[cardIdx];
        cardsData[cardIdx] = 0;

        var posIdx = n - 1;
        selPosSeries[posIdx] = positionsData[posIdx];
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
