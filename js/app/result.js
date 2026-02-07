$(document).ready(function(){
    // Probabilidades fixas fornecidas pelo usuário (em porcentagem)
    const FIXED_PROBABILITIES = {
        "S": [5.33, 1.78, 2.49, 1.78, 1.78, 1.78, 2.84, 1.77, 1.95, 2.31, 3.20, 4.44, 3.55],
        "H": [5.33, 1.78, 2.49, 1.78, 1.78, 1.78, 2.84, 1.77, 1.95, 2.31, 3.20, 4.44, 3.55],
        "C": [2.29, 0.76, 1.07, 0.76, 0.76, 0.76, 1.22, 0.76, 0.83, 0.99, 1.37, 1.90, 1.52],
        "D": [2.29, 0.76, 1.07, 0.76, 0.76, 0.76, 1.22, 0.76, 0.83, 0.99, 1.37, 1.90, 1.52]
    };

    // Probabilidades estimadas para posições 1-52 fornecidas pelo usuário
    const POSITION_PROBABILITIES = [
        3.30, 2.16, 5.08, 1.65, 2.03, 1.65, 9.53, 1.91, 1.78, 3.05, 2.80, 2.67, 4.06, // 1-13
        1.52, 1.52, 1.52, 3.81, 1.40, 1.40, 1.40, 4.45, 2.54, 3.56, 1.34, 1.34, 1.27, // 14-26
        1.21, 1.21, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, // 27-39
        1.14, 1.21, 2.41, 1.21, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.14, 1.22  // 40-52
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
        // O usuário quer que XX,XX * XX,XX resulte em um valor de 4 dígitos (2.7XX)
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
        
        renderCharts(card, suit, n, posFixedPerc);
    }

    function renderCharts(card, suit, n, posPercentage) {
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
            series: [{ label: " ", color: "#CECECE" }, { label: " ", color: "#FF0000" }],
            axes: {
                xaxis: { renderer: $.jqplot.CategoryAxisRenderer, showTicks: true },
                yaxis: { showTicks: false, pad: 0 }
            },
            grid: { drawGridLines: false, background: '#F7F7F7', borderWeight: 0, shadow: false }
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
