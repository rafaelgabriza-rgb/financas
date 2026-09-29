const form = document.getElementById("form-financeiro");

const descricaoInput = document.getElementById("descricao");
const valorInput = document.getElementById("valor");
const tipoInput = document.getElementById("tipo");
const dataInput = document.getElementById("data");

const saldoElement = document.getElementById("saldo");
const ganhosElement = document.getElementById("ganhos");
const gastosElement = document.getElementById("gastos");

const listaElement =
    document.getElementById("lista-movimentacoes");

const limparTudoButton =
    document.getElementById("limpar-tudo");

let movimentacoes =
    JSON.parse(
        localStorage.getItem("movimentacoes")
    ) || [];

let grafico = null;


/* =========================================================
   DATA ATUAL
========================================================= */

const hoje = new Date();

const ano = hoje.getFullYear();

const mes = String(
    hoje.getMonth() + 1
).padStart(2, "0");

const dia = String(
    hoje.getDate()
).padStart(2, "0");

dataInput.value =
    `${ano}-${mes}-${dia}`;


/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatarMoeda(valor) {

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function salvarMovimentacoes() {

    localStorage.setItem(
        "movimentacoes",
        JSON.stringify(movimentacoes)
    );
}


/* =========================================================
   RESUMO
========================================================= */

function atualizarResumo() {

    let ganhos = 0;
    let gastos = 0;


    movimentacoes.forEach(
        (movimentacao) => {

            if (
                movimentacao.tipo ===
                "ganho"
            ) {

                ganhos +=
                    movimentacao.valor;

            } else {

                gastos +=
                    movimentacao.valor;
            }
        }
    );


    const saldo =
        ganhos - gastos;


    saldoElement.textContent =
        formatarMoeda(saldo);

    ganhosElement.textContent =
        formatarMoeda(ganhos);

    gastosElement.textContent =
        formatarMoeda(gastos);


    atualizarGrafico();
}


/* =========================================================
   HISTÓRICO
========================================================= */

function atualizarLista() {

    listaElement.innerHTML = "";


    if (
        movimentacoes.length === 0
    ) {

        listaElement.innerHTML = `
            <p class="vazio">
                Nenhuma movimentação registrada.
            </p>
        `;

        return;
    }


    const lista =
        [...movimentacoes].sort(
            (a, b) => {

                return (
                    new Date(b.data) -
                    new Date(a.data)
                );

            }
        );


    lista.forEach(
        (movimentacao) => {

            const elemento =
                document.createElement(
                    "div"
                );


            elemento.className =
                "movimentacao";


            const data =
                new Date(
                    `${movimentacao.data}T00:00:00`
                ).toLocaleDateString(
                    "pt-BR"
                );


            const ganho =
                movimentacao.tipo ===
                "ganho";


            elemento.innerHTML = `

                <div class="movimentacao-info">

                    <span class="movimentacao-descricao">
                        ${escaparHTML(
                            movimentacao.descricao
                        )}
                    </span>

                    <span class="movimentacao-data">
                        ${data}
                    </span>

                </div>


                <div class="movimentacao-direita">

                    <span class="
                        movimentacao-valor
                        ${
                            ganho
                                ? "valor-ganho"
                                : "valor-gasto"
                        }
                    ">
                        ${ganho ? "+" : "-"}
                        ${formatarMoeda(
                            movimentacao.valor
                        )}
                    </span>


                    <button
                        class="botao-excluir"
                        onclick="
                            excluirMovimentacao(
                                ${movimentacao.id}
                            )
                        "
                        title="Excluir movimentação"
                    >
                        ×
                    </button>

                </div>

            `;


            listaElement.appendChild(
                elemento
            );

        }
    );
}


/* =========================================================
   PROTEÇÃO DE TEXTO
========================================================= */

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent = texto;

    return div.innerHTML;
}


/* =========================================================
   ADICIONAR
========================================================= */

form.addEventListener(
    "submit",
    (evento) => {

        evento.preventDefault();


        const descricao =
            descricaoInput.value.trim();

        const valor =
            Number(
                valorInput.value
            );

        const tipo =
            tipoInput.value;

        const data =
            dataInput.value;


        if (
            !descricao ||
            !valor ||
            valor <= 0 ||
            !data
        ) {

            return;
        }


        const movimentacao = {

            id: Date.now(),

            descricao:

                descricao,

            valor:

                valor,

            tipo:

                tipo,

            data:

                data

        };


        movimentacoes.push(
            movimentacao
        );


        salvarMovimentacoes();

        atualizarResumo();

        atualizarLista();


        form.reset();


        dataInput.value =
            `${ano}-${mes}-${dia}`;


        descricaoInput.focus();
    }
);


/* =========================================================
   EXCLUIR
========================================================= */

function excluirMovimentacao(id) {

    movimentacoes =
        movimentacoes.filter(
            (movimentacao) => {

                return (
                    movimentacao.id !==
                    id
                );

            }
        );


    salvarMovimentacoes();

    atualizarResumo();

    atualizarLista();
}


/* =========================================================
   LIMPAR TUDO
========================================================= */

limparTudoButton.addEventListener(
    "click",
    () => {

        if (
            movimentacoes.length === 0
        ) {

            return;
        }


        const confirmar =
            confirm(
                "Tem certeza que deseja apagar todas as movimentações?"
            );


        if (!confirmar) {

            return;
        }


        movimentacoes = [];


        salvarMovimentacoes();

        atualizarResumo();

        atualizarLista();
    }
);


/* =========================================================
   GRÁFICO DE EVOLUÇÃO DO SALDO
========================================================= */

function atualizarGrafico() {

    const canvas =
        document.getElementById(
            "grafico"
        );


    if (grafico) {

        grafico.destroy();
    }


    /*
        Ordena por data
    */

    const dados =
        [...movimentacoes].sort(
            (a, b) => {

                return (
                    new Date(a.data) -
                    new Date(b.data)
                );

            }
        );


    /*
        Sem movimentações
    */

    if (
        dados.length === 0
    ) {

        grafico =
            new Chart(
                canvas,
                {

                    type: "line",

                    data: {

                        labels: [],

                        datasets: []

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {
                                display: false
                            }

                        }

                    }

                }
            );

        return;
    }


    /*
        Calcula o saldo acumulado
    */

    let saldo = 0;

    const saldos = [];

    const labels = [];


    dados.forEach(
        (movimentacao) => {

            if (
                movimentacao.tipo ===
                "ganho"
            ) {

                saldo +=
                    movimentacao.valor;

            } else {

                saldo -=
                    movimentacao.valor;
            }


            saldos.push(saldo);


            labels.push(
                new Date(
                    `${movimentacao.data}T00:00:00`
                ).toLocaleDateString(
                    "pt-BR",
                    {
                        day: "2-digit",
                        month: "short"
                    }
                )
            );

        }
    );


    /*
        Gradiente da área
    */

    const contexto =
        canvas.getContext("2d");


    const gradiente =
        contexto.createLinearGradient(
            0,
            0,
            0,
            380
        );


    gradiente.addColorStop(
        0,
        "rgba(22, 160, 93, 0.18)"
    );


    gradiente.addColorStop(
        1,
        "rgba(22, 160, 93, 0)"
    );


    /*
        Cria gráfico
    */

    grafico =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Saldo",

                            data:
                                saldos,

                            borderColor:
                                "#16a05d",

                            backgroundColor:
                                gradiente,

                            borderWidth:
                                2.5,

                            pointBackgroundColor:
                                "#ffffff",

                            pointBorderColor:
                                "#16a05d",

                            pointBorderWidth:
                                2,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                6,

                            fill:
                                true,

                            tension:
                                0.35

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    animation: {

                        duration:
                            700,

                        easing:
                            "easeOutQuart"

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        tooltip: {

                            backgroundColor:
                                "#171717",

                            titleColor:
                                "#ffffff",

                            bodyColor:
                                "#ffffff",

                            padding:
                                12,

                            cornerRadius:
                                9,

                            displayColors:
                                false,


                            callbacks: {

                                title:
                                    function(
                                        contexto
                                    ) {

                                        const indice =
                                            contexto[0]
                                                .dataIndex;

                                        return
                                            dados[
                                                indice
                                            ].descricao;

                                    },


                                label:
                                    function(
                                        contexto
                                    ) {

                                        return (
                                            "Saldo: " +
                                            formatarMoeda(
                                                contexto.raw
                                            )
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            },

                            border: {

                                display:
                                    false

                            },

                            ticks: {

                                color:
                                    "#a3a3a3",

                                font: {

                                    size:
                                        11

                                },

                                maxRotation:
                                    0

                            }

                        },


                        y: {

                            border: {

                                display:
                                    false

                            },

                            grid: {

                                color:
                                    "rgba(0,0,0,0.055)"

                            },

                            ticks: {

                                color:
                                    "#a3a3a3",

                                padding:
                                    10,

                                font: {

                                    size:
                                        11

                                },

                                callback:
                                    function(
                                        valor
                                    ) {

                                        return valor.toLocaleString(
                                            "pt-BR",
                                            {
                                                style:
                                                    "currency",

                                                currency:
                                                    "BRL",

                                                maximumFractionDigits:
                                                    0
                                            }
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

atualizarResumo();

atualizarLista();