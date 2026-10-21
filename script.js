/* ==========================================================================
   1. INICIALIZADOR DE EVENTOS BLINDADO COM SEGURANÇA DE ROTAS (PROFISSIONAL)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Lógicas globais obrigatórias em 100% das páginas do ecossistema
    try { atualizarContadorMenu(); } catch(e) {}
    try { renderizarBarraUsuarioNavbar(); } catch(e) {}

    // 2. RENDERIZAÇÃO IMEDIATA DO CHECKOUT (Evita tela em branco no GitHub)
    try {
        if (document.getElementById("checkout-items-container")) {
            // Desenha os produtos e valores na tela primeiro
            renderizarCheckout();

            // Depois aplica a trava de segurança em segundo plano
            const sessao = JSON.parse(localStorage.getItem("cafeteria_usuario_ativo"));
            if (!sessao || !sessao.logado) {
                alert("🔒 Sessão expirada ou inválida. Por favor, faça login para acessar o checkout.");
                window.location.href = "login.html";
                return;
            }
        }
    } catch(e) { console.log("Erro na inicialização do checkout:", e); }

    // 3. Execuções específicas por identificadores de tela (try/catch isolados)
    try { if (document.querySelectorAll(".btn-add").length > 0) inicializarBotoesHome(); } catch(e) {}
    try { if (document.getElementById("cart-items-container")) renderizarCarrinho(); } catch(e) {}
    try { if (document.getElementById("success-items-container")) renderizarPaginaSucesso(); } catch(e) {}
    try { if (document.querySelectorAll(".sidebar-filters").length > 0) inicializarFiltrosProdutos(); } catch(e) {}
    try { if (document.getElementById("input-min")) inicializarFaixaPrecoInterativa(); } catch(e) {}
    try { if (document.getElementById("orders-history-container")) renderizarHistoricoCompleto(); } catch(e) {}
    try { if (document.getElementById("profile-orders-container")) renderizarHistoricoPerfil(); } catch(e) {}
    try { if (document.getElementById("detail-order-id")) renderizarDetalhesDoPedido(); } catch(e) {}
    try { if (document.getElementById("product-thumbnails")) inicializarGaleriaDetalhes(); } catch(e) {}
    try { if (document.getElementById("admin-tabela-produtos")) inicializarPainelAdmin(); } catch(e) {}
    try { if (document.getElementById("form-admin-produto")) inicializarFormularioCadastroAdmin(); } catch(e) {}
    try { if (document.getElementById("form-login-cliente")) inicializarLogicaLogin(); } catch(e) {}
    try { if (document.getElementById("form-cadastro-cliente")) inicializarLogicaCadastro(); } catch(e) {}
    try { if (document.getElementById("profile-user-card")) inicializarDadosPerfilDinamico(); } catch(e) {}
    try { if (document.getElementById("form-alterar-perfil-completo")) inicializarFormularioAlterarPerfil(); } catch(e) {}
});


/* ==========================================================================
   2. MÓDULO: CARRINHO GLOBAL (GRAVAÇÃO, CONTADOR E ADIÇÃO)
   ========================================================================== */
function inicializarBotoesHome() {
    const botoesAdicionar = document.querySelectorAll(".btn-add");

    botoesAdicionar.forEach(botao => {
        botao.addEventListener("click", (evento) => {
            const alvo = evento.target.closest(".btn-add");
            if (!alvo) return;

            const id = alvo.getAttribute("data-id");
            const name = alvo.getAttribute("data-name");
            const price = alvo.getAttribute("data-price");
            const image = alvo.getAttribute("data-image");

            if (!id || !name || !price) {
                alert(`⚠️ ERRO TÉCNICO: Atributos data- faltando no HTML deste botão.`);
                return;
            }

            const produto = {
                id: id,
                name: name,
                price: parseFloat(price),
                image: image || "https://unsplash.com",
                quantity: 1
            };

            adicionarAoCarrinho(produto);
        });
    });
}

function adicionarAoCarrinho(produtoNovo) {
    let carrinho = JSON.parse(localStorage.getItem("cafeteria_carrinho")) || [];
    const produtoExistente = carrinho.find(item => item.id === produtoNovo.id);

    if (produtoExistente) {
        produtoExistente.quantity += 1;
    } else {
        carrinho.push(produtoNovo);
    }

    localStorage.setItem("cafeteria_carrinho", JSON.stringify(carrinho));
    atualizarContadorMenu();
    alert(`${produtoNovo.name} adicionado ao carrinho!`);
}

function atualizarContadorMenu() {
    const cartBadge = document.querySelector(".cart-badge");
    if (!cartBadge) return;

    let carrinho = JSON.parse(localStorage.getItem("cafeteria_carrinho")) || [];
    const totalItens = carrinho.reduce((acumulador, item) => acumulador + item.quantity, 0);
    cartBadge.textContent = totalItens;
}

/* ==========================================================================
   3. MÓDULO: RENDERIZAÇÃO DINÂMICA DA TELA DE MEU CARRINHO
   ========================================================================== */
function renderizarCarrinho() {
    const container = document.getElementById("cart-items-container");
    if (!container) return;
    
    let carrinho = JSON.parse(localStorage.getItem("cafeteria_carrinho")) || [];

    if (carrinho.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px; width: 100%;">Seu carrinho está vazio.</p>`;
        atualizarValoresFinanceiros(0);
        return;
    }

    container.innerHTML = "";

    carrinho.forEach(item => {
        const precoTotalItem = (item.price * item.quantity).toFixed(2).replace(".", ",");
        
        const itemHTML = `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-product-info">
                    <div class="item-img-box">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="item-text-details">
                        <h4>${item.name}</h4>
                        <span class="item-weight">250g</span>
                    </div>
                </div>
                <div class="item-quantity-control">
                    <div class="qty-selector">
                        <button type="button" class="qty-btn btn-diminuir">-</button>
                        <input type="number" value="${item.quantity}" readonly>
                        <button type="button" class="qty-btn btn-aumentar">+</button>
                    </div>
                </div>
                <div class="item-price-actions">
                    <span class="item-total-price">R$ ${precoTotalItem}</span>
                    <button type="button" class="btn-delete" style="font-size: 16px; display: inline-flex; align-items: center; justify-content: center;">🗑️</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", itemHTML);
    });

    inicializarEventosItensCarrinho();
    calcularTotaisCarrinho(carrinho);
}

function inicializarEventosItensCarrinho() {
    let carrinho = JSON.parse(localStorage.getItem("cafeteria_carrinho")) || [];

    document.querySelectorAll(".btn-aumentar").forEach(botao => {
        botao.addEventListener("click", () => {
            const id = botao.closest(".cart-item").getAttribute("data-id");
            const item = carrinho.find(prod => prod.id === id);
            if (item) item.quantity += 1;
            salvarERenderizar(carrinho);
        });
    });

    document.querySelectorAll(".btn-diminuir").forEach(botao => {
        botao.addEventListener("click", () => {
            const id = botao.closest(".cart-item").getAttribute("data-id");
            const item = carrinho.find(prod => prod.id === id);
            if (item) {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    carrinho = carrinho.filter(prod => prod.id !== id);
                }
            }
            salvarERenderizar(carrinho);
        });
    });

    document.querySelectorAll(".btn-delete").forEach(botao => {
        botao.addEventListener("click", () => {
            const id = botao.closest(".cart-item").getAttribute("data-id");
            carrinho = carrinho.filter(prod => prod.id !== id);
            salvarERenderizar(carrinho);
        });
    });
}

function salvarERenderizar(novoCarrinho) {
    localStorage.setItem("cafeteria_carrinho", JSON.stringify(novoCarrinho));
    atualizarContadorMenu();
    renderizarCarrinho();
}

function calcularTotaisCarrinho(carrinho) {
    const subtotal = carrinho.reduce((soma, item) => soma + (item.price * item.quantity), 0);
    atualizarValoresFinanceiros(subtotal);
}

function atualizarValoresFinanceiros(subtotal) {
    const frete = subtotal > 0 ? 9.90 : 0;
    const total = subtotal + frete;

    document.getElementById("cart-subtotal").textContent = "R$ " + subtotal.toFixed(2).replace(".", ",");
    document.getElementById("cart-shipping").textContent = "R$ " + frete.toFixed(2).replace(".", ",");
    document.getElementById("cart-total").textContent = "R$ " + total.toFixed(2).replace(".", ",");

    // CONFIGURAÇÃO DA TRAVA DE SEGURANÇA NO BOTÃO DE FINALIZAR DO CARRINHO
    const btnCheckout = document.querySelector(".btn-checkout");
    if (btnCheckout) {
        // Remove ouvintes antigos para evitar duplicação de cliques na memória
        const btnClonado = btnCheckout.cloneNode(true);
        btnCheckout.parentNode.replaceChild(btnClonado, btnCheckout);

        btnClonado.addEventListener("click", (evento) => {
            evento.preventDefault();

            // 1. Verifica na memória local se existe uma sessão de login ativa
            const usuarioLogado = JSON.parse(localStorage.getItem("cafeteria_usuario_ativo"));

            if (!usuarioLogado || !usuarioLogado.logado) {
                // 2. Bloqueio: Cliente deslogado é avisado e enviado para o Login
                alert("🔒 Acesso Restrito: Para garantir a segurança dos seus dados, por favor faça login ou cadastre-se antes de prosseguir para o pagamento!");
                window.location.href = "login.html";
            } else {
                // 3. Liberado: Cliente logado avança para o painel de pagamento
                window.location.href = "checkout.html";
            }
        });
    }
}


/* ==========================================================================
   4. MÓDULO: RENDERIZAÇÃO DINÂMICA DA TELA DE CHECKOUT E PAGAMENTO REAL (MERCADO PAGO)
   ========================================================================== */
function renderizarCheckout() {
    const container = document.getElementById("checkout-items-container");
    if (!container) return;

    let carrinho = JSON.parse(localStorage.getItem("cafeteria_carrinho")) || [];

    if (carrinho.length === 0) {
        container.innerHTML = '<p style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 20px;">Nenhum item selecionado.</p>';
        atualizarValoresCheckout(0);
        return;
    }

    container.innerHTML = "";

    // Loop que desenha os produtos comprados no painel lateral
    carrinho.forEach(item => {
        const precoCalculadoItem = (item.price * item.quantity).toFixed(2).replace(".", ",");
        
        const linhaHTML = `
            <div class="summary-item-line">
                <div class="summary-item-thumb">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="summary-item-info">
                    <h4>${item.name}</h4>
                </div>
                <div class="summary-item-price">
                    <span>${item.quantity}x R$ ${precoCalculadoItem}</span>
                </div>
            </div>`;
        container.insertAdjacentHTML("beforeend", linhaHTML);
    });

    const subtotalCheckout = carrinho.reduce((soma, item) => soma + (item.price * item.quantity), 0);
    atualizarValoresCheckout(subtotalCheckout);
    
    // Inicializa o ouvinte do botão que fará a cobrança real
    inicializarBotaoFinalizar();
    
    if (document.getElementById("cep")) {
        inicializarMascaraEBuscaCEP();
    }
}

function atualizarValoresCheckout(subtotal) {
    const frete = subtotal > 0 ? 9.90 : 0;
    const total = subtotal + frete;

    const elSub = document.getElementById("checkout-subtotal");
    const elFre = document.getElementById("checkout-frete");
    const elTot = document.getElementById("checkout-total");

    if (elSub) elSub.textContent = "R\$ " + subtotal.toFixed(2).replace(".", ",");
    if (elFre) elFre.textContent = "R\$ " + frete.toFixed(2).replace(".", ",");
    if (elTot) elTot.textContent = "R\$ " + total.toFixed(2).replace(".", ",");
}

// AQUI ESTÁ O FETCH CORRIGIDO E INTEGRADO AO SEU SERVIDOR DA VERCEL
function inicializarBotaoFinalizar() {
    const btnFinalizar = document.getElementById("btn-finalizar-pedido");
    if (!btnFinalizar) return;

    btnFinalizar.addEventListener("click", async (evento) => {
        evento.preventDefault(); 
        
        let carrinho = JSON.parse(localStorage.getItem("cafeteria_carrinho")) || [];
        if (carrinho.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        const usuarioAtivo = JSON.parse(localStorage.getItem("cafeteria_usuario_ativo")) || {};

        // Modificação visual para dar feedback de segurança ao cliente
        btnFinalizar.innerText = "🔒 Conectando ao Ambiente de Pagamento Seguro...";
        btnFinalizar.style.backgroundColor = "var(--success-green)";
        btnFinalizar.disabled = true;

        // Prepara o pacote de dados para disparar ao servidor back-end
        const dadosTransacao = {
            itens: carrinho,
            emailUsuario: usuarioAtivo.email || "cliente@email.com"
        };

        try {
            // CONEXÃO MESTRE: Faz o fetch real para a API serverless protegida na Vercel
            // IMPORTANTE: Insira dentro das aspas abaixo o seu link copiado da aba DOMAINS da Vercel!
            const respostaServidor = await fetch("https://cafeteria-gourmet-one.vercel.app/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosTransacao)
            });

            const resultadoAPI = await respostaServidor.json();

            if (resultadoAPI.urlCheckout) {
                // REDIRECIONAMENTO CRIPTOGRAFADO: Abre a interface oficial de PIX e Cartão do Mercado Pago
                window.location.href = resultadoAPI.urlCheckout;
            } else {
                alert("⚠️ Ocorreu um problema ao gerar a preferência de pagamento. Tente novamente.");
                resetarBotaoFinalizar(btnFinalizar);
            }

        } catch (erro) {
            console.error("Erro na comunicação com a API de pagamentos:", erro);
            alert("Não foi possível estabelecer uma conexão segura com o gateway de pagamento.");
            resetarBotaoFinalizar(btnFinalizar);
        }
    });
}

function resetarBotaoFinalizar(botao) {
    botao.innerText = "Finalizar Pedido";
    botao.disabled = false;
    botao.style.backgroundColor = "var(--bg-dark-brown)";
}



/* ==========================================================================
   5. MÓDULO: INTEGRAÇÃO DA API VIACEP
   ========================================================================== */
function inicializarMascaraEBuscaCEP() {
    const inputCep = document.getElementById("cep");
    if (!inputCep) return;

    inputCep.addEventListener("input", (e) => {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor.length > 5) {
            valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
        }
        e.target.value = valor;
        if (valor.length === 9) {
            buscarEnderecoPeloCEP(valor);
        }
    });
}

function buscarEnderecoPeloCEP(cepFormatado) {
    const cepLimpo = cepFormatado.replace(/\D/g, "");
    const campoEndereco = document.getElementById("endereco");
    const campoBairro = document.getElementById("bairro");
    const campoCidade = document.getElementById("cidade");

    campoEndereco.value = "Buscando...";
    campoBairro.value = "Buscando...";
    campoCidade.value = "Buscando...";

    fetch(`https://viacep.com.br{cepLimpo}/json/`)
        .then(resposta => resposta.json())
        .then(dados => {
            if (dados.erro) {
                alert("⚠️ CEP não encontrado!");
                limparCamposEndereco();
                return;
            }
            campoEndereco.value = dados.logradouro || "";
            campoBairro.value = dados.bairro || "";
            campoCidade.value = dados.localidade ? `${dados.localidade} - ${dados.uf}` : "";
            const campoNumero = document.getElementById("numero");
            if (campoNumero) campoNumero.focus();
        })
        .catch(() => {
            alert("Não foi possível conectar ao ViaCEP.");
            limparCamposEndereco();
        });
}

function limparCamposEndereco() {
    document.getElementById("endereco").value = "";
    document.getElementById("bairro").value = "";
    document.getElementById("cidade").value = "";
}

/* ==========================================================================
   6. MÓDULO: RENDERIZAÇÃO DA PÁGINA DE SUCESSO (PEDIDO CONFIRMADO)
   ========================================================================== */
function renderizarPaginaSucesso() {
    const containerItens = document.getElementById("success-items-container");
    const displayID = document.getElementById("order-id-display");
    const displayTotal = document.getElementById("success-total-display");
    const ultimoPedido = JSON.parse(localStorage.getItem("cafeteria_ultimo_pedido"));

    if (!ultimoPedido) {
        window.location.href = "index.html";
        return;
    }

    displayID.textContent = ultimoPedido.id;
    displayTotal.textContent = `R$ ${ultimoPedido.total.toFixed(2).replace(".", ",")}`;
    containerItens.innerHTML = "";

    ultimoPedido.items.forEach(item => {
        const precoFormatadoItem = (item.price * item.quantity).toFixed(2).replace(".", ",");
        const linhaSucessoHTML = `
            <div class="summary-item-row">
                <span class="item-name">${item.name}</span>
                <span class="item-qty-price">${item.quantity}x R$ ${precoFormatadoItem}</span>
            </div>
        `;
        containerItens.insertAdjacentHTML("beforeend", linhaSucessoHTML);
    });

    localStorage.removeItem("cafeteria_carrinho");
    atualizarContadorMenu();
}

/* ==========================================================================
   7. MÓDULO: FILTRAGEM DINÂMICA DE PRODUTOS POR CATEGORIA (CATÁLOGO)
   ========================================================================== */
function inicializarFiltrosProdutos() {
    const checkboxes = document.querySelectorAll(".sidebar-filters input[type='checkbox']");
    const cardsProdutos = document.querySelectorAll(".products-grid .product-card");
    if (checkboxes.length === 0 || cardsProdutos.length === 0) return;

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const categoriasMarcadas = Array.from(checkboxes).filter(i => i.checked).map(i => i.value);
            if (categoriasMarcadas.length === 0) {
                cardsProdutos.forEach(card => card.classList.remove("escondido-filtro"));
                return;
            }
            cardsProdutos.forEach(card => {
                const categoriaProduto = card.getAttribute("data-category");
                if (categoriasMarcadas.includes(categoriaProduto)) {
                    card.classList.remove("escondido-filtro");
                } else {
                    card.classList.add("escondido-filtro");
                }
            });
        });
    });
}

/* ==========================================================================
   8. MÓDULO: SELETOR DE PREÇO INTERATIVO E FILTRAGEM FINANCEIRA
   ========================================================================== */
function inicializarFaixaPrecoInterativa() {
    const inputMin = document.getElementById("input-min");
    const inputMax = document.getElementById("input-max");
    const labelMin = document.getElementById("label-min");
    const labelMax = document.getElementById("label-max");
    const track = document.getElementById("slider-track-fill");
    const btnAplicar = document.getElementById("btn-apply-price") || document.getElementById("btn-aplicar-preco");
    const cardsProdutos = document.querySelectorAll(".products-grid .product-card");
    if (!inputMin || !inputMax) return;

    function atualizarSlider() {
        let minVal = parseInt(inputMin.value);
        let maxVal = parseInt(inputMax.value);
        if (minVal > maxVal - 5) {
            inputMin.value = maxVal - 5;
            minVal = maxVal - 5;
        }
        labelMin.textContent = `R$ ${minVal}`;
        labelMax.textContent = `R$ ${maxVal}`;
        const percentVal1 = (minVal / inputMin.max) * 100;
        const percentVal2 = (maxVal / inputMax.max) * 100;
        if (track) {
            track.style.background = `linear-gradient(to right, var(--border-color) ${percentVal1}%, var(--bg-dark-brown) ${percentVal1}%, var(--bg-dark-brown) ${percentVal2}%, var(--border-color) ${percentVal2}%)`;
        }
    }

    inputMin.addEventListener("input", atualizarSlider);
    inputMax.addEventListener("input", atualizarSlider);
    atualizarSlider();

    if (btnAplicar) {
        btnAplicar.addEventListener("click", () => {
            const pMin = parseInt(inputMin.value);
            const pMax = parseInt(inputMax.value);
            cardsProdutos.forEach(card => {
                const botaoItem = card.querySelector(".btn-add");
                if (!botaoItem) return;
                const precoProd = parseFloat(botaoItem.getAttribute("data-price"));
                if (precoProd >= pMin && precoProd <= pMax) {
                    if (!card.classList.contains("escondido-filtro")) {
                        card.style.setProperty("display", "flex", "important");
                    }
                } else {
                    card.style.setProperty("display", "none", "important");
                }
            });
        });
    }
}

/* ==========================================================================
   9. MÓDULO: EXIBIÇÃO HISTÓRICA ACUMULATIVA (PERFIL E TODOS OS PEDIDOS)
   ========================================================================== */
function renderizarHistoricoCompleto() {
    const container = document.getElementById("orders-history-container");
    const contadorTexto = document.getElementById("orders-total-count");
    if (!container) return;
    let historico = JSON.parse(localStorage.getItem("cafeteria_historico_pedidos")) || [];
if (contadorTexto) {
    contadorTexto.textContent = `${historico.lenght} ${historico.lenght === 1 ? 'pedido realizado' : 'pedidos realizados'}`;
}
    if (historico.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px; width: 100%;">Você ainda não realizou nenhum pedido.</p>`;
        return;
    }

    container.innerHTML = "";
    
    historico.forEach(pedido => {
        const totalFormatado = pedido.total.toFixed(2).replace(".", ",");
        const imagemCapa = pedido.items && pedido.items[0] ? pedido.items[0].image : "https://unsplash.com";
        
        const blocoPedidoHTML = `
            <div class="order-page-item"> 
                <div class="order-visual-thumb">
                    <img src="${imagemCapa}" alt="Café">
                </div> 
                <div class="order-text-info"> 
                    <h3>Pedido ${pedido.id}</h3> 
                    <p class="order-date-meta"><i class="far fa-calendar"></i> Realizado em ${pedido.data}</p> 
                    <p class="order-price-meta"><i class="fas fa-wallet"></i> Valor total: <strong>R$ ${totalFormatado}</strong></p> 
                </div> 
                <div class="order-status-wrapper"> 
                    <span class="status-title-tag">Status</span> 
                    <div class="status-badge-tag status-processing">
                        <i class="far fa-clock"></i> ${pedido.status || "Processando"}
                    </div> 
                </div> 
                <div class="order-btn-wrapper"> 
                    <button type="button" class="btn-action-details" onclick="window.location.href='pedido-detalhes.html?id=${pedido.id.replace('#', '')}'">Ver detalhes do pedido</button> 
                </div> 
            </div>`;
            
        container.insertAdjacentHTML("beforeend", blocoPedidoHTML);
    });
}

function renderizarHistoricoPerfil() {
    const containerPerfil = document.getElementById("profile-orders-container");
    if (!containerPerfil) return;
    
    let historico = JSON.parse(localStorage.getItem("cafeteria_historico_pedidos")) || [];
    
    if (historico.length === 0) {
        containerPerfil.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); padding: 20px; text-align: center; width: 100%;">Nenhum pedido recente.</p>`;
        return;
    }
    
    containerPerfil.innerHTML = "";
    
    historico.slice(0, 3).forEach(pedido => {
        const totalFormatado = pedido.total.toFixed(2).replace(".", ",");
        const imagemCapa = pedido.items && pedido.items.image ? pedido.items.image : "https://unsplash.com";
        
        const linhaPerfilHTML = `
            <div class="order-item-row"> 
                <div class="order-thumb">
                    <img src="${imagemCapa}" alt="Foto">
                </div> 
                <div class="order-main-info"> 
                    <h4>Pedido ${pedido.id}</h4> 
                    <p><i class="far fa-calendar"></i> ${pedido.data}</p> 
                    <p class="order-total-value"><i class="fas fa-dollar-sign"></i> Total: <strong>R$ ${totalFormatado}</strong></p> 
                </div> 
                <div class="order-status-box"> 
                    <span class="status-label">Status</span> 
                    <div class="status-badge badge-processing"><i class="far fa-clock"></i> ${pedido.status || "Processando"}</div> 
                </div> 
                <div class="order-action-box"> 
                    <button class="btn-order-details" onclick="window.location.href='pedido-detalhes.html?id=${pedido.id.replace('#', '')}'">Ver detalhes</button> 
                </div> 
            </div>`;
            
        containerPerfil.insertAdjacentHTML("beforeend", linhaPerfilHTML);
    });
}
/* ==========================================================================
10. MÓDULO: DETALHAMENTO DE PEDIDOS INDIVIDUAIS
========================================================================== */
function renderizarDetalhesDoPedido() {
    const parametrosURL = new URLSearchParams(window.location.search);
    let idPedidoBuscado = parametrosURL.get("id");
    const historico = JSON.parse(localStorage.getItem("cafeteria_historico_pedidos")) || [];
    let pedidoEncontrado = historico.find(p => p.id.replace("#", "") === idPedidoBuscado) || JSON.parse(localStorage.getItem("cafeteria_ultimo_pedido"));
    
    if (!pedidoEncontrado) return;

    // CORRIGIDO: Adicionadas as crases para ler a variável do ID do pedido
    document.getElementById("detail-order-id").textContent = `Pedido ${pedidoEncontrado.id}`;
    
    // CORRIGIDO: Adicionadas as crases para o HTML do ícone de calendário
    document.getElementById("detail-order-date").innerHTML = `<i class="far fa-calendar"></i> Realizado em ${pedidoEncontrado.data}`;
    
    const containerEntrega = document.getElementById("detail-delivery-box");
    if (containerEntrega) {
        // CORRIGIDO: Adicionadas as crases para encapsular o bloco de texto do endereço
        containerEntrega.innerHTML = `
            <p class="info-main-text">Lucas Oliveira</p> 
            <p class="info-sub-text">Rua das Flores, 123 - Centro</p> 
            <p class="info-sub-text">Brasília - DF</p> 
            <p class="info-sub-text">CEP: 70000-000</p> 
            <p class="info-sub-text"><i class="fas fa-phone-alt"></i> (61) 99999-9999</p>`;
    }

    const containerItens = document.getElementById("detail-items-container");
    if (containerItens) {
        containerItens.innerHTML = "";
        pedidoEncontrado.items.forEach(item => {
            const subTotalItem = (item.price * item.quantity).toFixed(2).replace(".", ",");
            
            // CORRIGIDO: Adicionadas as crases para a estrutura de cada linha de produto comprado
            containerItens.insertAdjacentHTML("beforeend", `
                <div class="details-item-line"> 
                    <div class="details-item-thumb">
                        <img src="${item.image}">
                    </div> 
                    <div class="details-item-info">
                        <h4>${item.name}</h4>
                        <span class="details-item-weight">250g</span>
                    </div> 
                    <div class="details-item-price">
                        <span>${item.quantity}x R$ ${subTotalItem}</span>
                    </div> 
                </div>`);
        });
    }

    const subtotal = pedidoEncontrado.total - 9.90;
    
    // CORRIGIDO: Adicionadas as crases para a formatação monetária dos totais
    document.getElementById("detail-subtotal").textContent = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
    document.getElementById("detail-shipping").textContent = "R\$ 9,90";
    document.getElementById("detail-total").textContent = `R$ ${pedidoEncontrado.total.toFixed(2).replace(".", ",")}`;
}

/* ==========================================================================
11. MÓDULO: MÁSCARA AUTOMÁTICA DE TELEFONE
========================================================================== */
function inicializarMascaraTelefone() {
    const inputTelefone = document.getElementById("telefone");
    if (!inputTelefone) return;

    inputTelefone.addEventListener("input", (evento) => {
        let valor = evento.target.value.replace(/\D/g, ""); // Remove o que não for número

        if (valor.length > 3) {
            valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
        }
        if (valor.length > 9) {
            // Se for celular (9 dígitos), coloca o hífen após o quinto número
            valor = valor.replace(/(\d{5})(\d{4})$/, "$1-$2");
        } else if (valor.length > 8) {
            // Se for telefone fixo antigo (8 dígitos), coloca o hífen após o quarto número
            valor = valor.replace(/(\d{4})(\d{4})$/, "$1-$2");
        }
        
        evento.target.value = valor;
    });
}
/* ==========================================================================
12. MÓDULO: GALERIA INTERATIVA DE MINIATURAS (PRODUTO-DETALHE)
========================================================================== */
function inicializarGaleriaDetalhes() {
const imagemPrincipal = document.getElementById("main-product-image");
const containerMiniaturas = document.getElementById("product-thumbnails");
if (!imagemPrincipal || !containerMiniaturas) return;
const miniaturas = containerMiniaturas.querySelectorAll(".thumb-box");
miniaturas.forEach(miniatura => {
miniatura.addEventListener("click", () => {
const tagImg = miniatura.querySelector("img");
if (tagImg) {
imagemPrincipal.setAttribute("src", tagImg.getAttribute("src"));
miniaturas.forEach(box => box.classList.remove("active"));
miniatura.classList.add("active");
}
});
});
}
/* ==========================================================================
13. MÓDULO: PAINEL ADMINISTRATIVO (DASHBOARD)
========================================================================== */
/* ==========================================================================
   13. MÓDULO: PAINEL ADMINISTRATIVO (DASHBOARD)
   ========================================================================== */
function inicializarPainelAdmin() {
    const historicoPedidos = JSON.parse(localStorage.getItem("cafeteria_historico_pedidos")) || [];
    const faturamentoTotal = historicoPedidos.reduce((soma, p) => soma + p.total, 0);
    
    // CORRIGIDO: Adicionadas as crases obrigatórias para a string de faturamento
    document.getElementById("admin-faturamento").textContent = `R$ ${faturamentoTotal.toFixed(2).replace(".", ",")}`;
    document.getElementById("admin-pedidos-count").textContent = historicoPedidos.length;
    renderizarTabelaAdmin();
}

function renderizarTabelaAdmin() {
    const tabelaBody = document.getElementById("admin-tabela-produtos");
    if (!tabelaBody) return;

    // CORRIGIDO: Substituídos os links quebrados por imagens reais de alta qualidade
    let produtosLista = JSON.parse(localStorage.getItem("cafeteria_produtos_admin")) || [
        { id: "1", name: "Café Especial Bourbon", type: "Especial", price: 32.90, stock: "45 un", image: "https://unsplash.com" },
        { id: "2", name: "Café Gourmet 100% Arábica", type: "Gourmet", price: 28.90, stock: "32 un", image: "https://unsplash.com" },
        { id: "3", name: "Café Orgânico Torra Média", type: "Orgânico", price: 34.90, stock: "5 un", image: "https://unsplash.com" }
    ];

    localStorage.setItem("cafeteria_produtos_admin", JSON.stringify(produtosLista));
    tabelaBody.innerHTML = "";

    // CORRIGIDO: HTML da tabela restaurado por completo com as tags estruturais tr/td do design mestre
    produtosLista.forEach(prod => {
        const precoFormatado = prod.price.toFixed(2).replace(".", ",");
        const classeEstoque = parseInt(prod.stock) <= 5 ? "low-stock" : "in-stock";

        tabelaBody.insertAdjacentHTML("beforeend", `
            <tr data-id="${prod.id}">
                <td><div class="table-img-thumb"><img src="${prod.image}" alt="${prod.name}"></div></td>
                <td><strong class="prod-title">${prod.name}</strong></td>
                <td><span class="type-tag">${prod.type}</span></td>
                <td>R$ ${precoFormatado}</td>
                <td><span class="stock-badge ${classeEstoque}">${prod.stock}</span></td>
                <td class="text-center">
                    <div class="table-actions">
                        <button class="btn-action-edit" title="Editar" onclick="window.location.href='admin-produto.html?id=${prod.id}'"><i class="far fa-edit"></i></button>
                        <button class="btn-action-delete" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `);
    });

    document.querySelectorAll("#admin-tabela-produtos .btn-action-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const tr = e.target.closest("tr");
            const id = tr.getAttribute("data-id");
            if (confirm("Deseja excluir este produto?")) {
                produtosLista = produtosLista.filter(p => p.id !== id);
                localStorage.setItem("cafeteria_produtos_admin", JSON.stringify(produtosLista));
                renderizarTabelaAdmin();
            }
        });
    });
}

function inicializarFormularioCadastroAdmin() {
    const form = document.getElementById("form-admin-produto");
    if (!form) return;
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const nome = document.getElementById("prod-name").value;
        const tipoSelect = document.getElementById("prod-type");
        const preco = parseFloat(document.getElementById("prod-price").value);
        const estoque = document.getElementById("prod-stock").value;

        // CORRIGIDO: Adicionadas as crases obrigatórias na propriedade stock
        const novoProduto = {
            id: String(Date.now()),
            name: nome,
            type: tipoSelect.options[tipoSelect.selectedIndex].text,
            price: preco,
            stock: `${estoque} un`,
            image: "https://unsplash.com"
        };

        let lista = JSON.parse(localStorage.getItem("cafeteria_produtos_admin")) || [];
        lista.push(novoProduto);
        localStorage.setItem("cafeteria_produtos_admin", JSON.stringify(lista));
        alert("Produto cadastrado com sucesso!");
        window.location.href = "admin.html";
    });
}

/* ==========================================================================
14. MÓDULO: INTERATIVIDADE DO MENU HAMBÚRGUER MOBILE
========================================================================== */
/* ==========================================================================
   14. MÓDULO: INTERATIVIDADE DIRETA DO MENU HAMBÚRGUER (SISTEMA ONCLICK)
   ========================================================================== */
function toggleMenuMobile() {
    const botao = document.getElementById("menu-hamburger");
    const menu = document.getElementById("nav-menu");
    
    if (!botao || !menu) return;

    // Alterna a classe de abertura de forma instantânea
    menu.classList.toggle("menu-aberto");

    // Troca o caractere de ☰ para ✕ dependendo do estado
    if (menu.classList.contains("menu-aberto")) {
        botao.textContent = "✕";
    } else {
        botao.textContent = "☰";
    }
}

/* ==========================================================================
   MÓDULO: CONTROLE E VALIDAÇÃO DA TELA DE LOGIN
   ========================================================================== */
function inicializarLogicaLogin() {
    const formularioLogin = document.getElementById("form-login-cliente");
    if (!formularioLogin) return;

    formularioLogin.addEventListener("submit", (evento) => {
        evento.preventDefault(); 

        const campoEmail = document.getElementById("login-email").value.trim();
        const campoSenha = document.getElementById("login-password").value;

        // VALIDAÇÃO: Padrão RegExp nativo limpo que aceita estritamente name@domain.com sem erros de sintaxe
        const regexEmail = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
        
        if (!regexEmail.test(campoEmail)) {
            alert("⚠️ Por favor, insira um endereço de e-mail válido contendo '@' e um domínio (Ex: name@gmail.com)!");
            return;
        }

        if (campoSenha.length < 4) {
            alert("⚠️ A senha inserida está muito curta! Digite pelo menos 4 caracteres.");
            return;
        }

        // Login Técnico do Administrador
        if (campoEmail === "admin@cafeteria.com" && campoSenha === "admin") {
            alert("☕ Acesso concedido: Entrando no Painel Administrativo!");
            window.location.href = "admin.html";
            return;
        }

        // Login de Cliente Padrão
        const parteDoNome = campoEmail.split("@")[0];
        const nomeCapitalizado = parteDoNome.charAt(0).toUpperCase() + parteDoNome.slice(1);

        const sessaoUsuario = {
            logado: true,
            nome: nomeCapitalizado,
            email: campoEmail,
            avatar: "https://dicebear.com" + parteDoNome
        };

        localStorage.setItem("cafeteria_usuario_ativo", JSON.stringify(sessaoUsuario));
        alert("Seja bem-vindo, " + nomeCapitalizado + "! Login efetuado com sucesso.");
        window.location.href = "produtos.html";
    });
}

/* ==========================================================================
   MÓDULO: EXIBIÇÃO DINÂMICA DE SENHA E RECUPERAÇÃO DE CONTA
   ========================================================================== */
function toggleMostrarSenha() {
    const botaoOlho = document.getElementById("btn-toggle-senha");
    const inputSenha = document.getElementById("login-password");

    if (!botaoOlho || !inputSenha) return;

    // Alterna o tipo do input e o emoji de forma direta
    if (inputSenha.type === "password") {
        inputSenha.type = "text";
        botaoOlho.textContent = "🙈"; // Muda para o macaco cobrindo os olhos ao mostrar a senha
    } else {
        inputSenha.type = "password";
        botaoOlho.textContent = "👁️"; // Volta para o olho aberto ao esconder a senha
    }
}

function recuperarSenhaFicticia(evento) {
    evento.preventDefault();
    const campoEmail = document.getElementById("login-email");
    const emailDigitado = campoEmail ? campoEmail.value.trim() : "";
    
    if (!emailDigitado) {
        alert("🔑 Por favor, digite o seu e-mail no campo correspondente primeiro, depois clique em 'Esqueceu a senha?' para enviarmos o link.");
    } else {
        alert("Um link de redefinição de senha foi gerado e enviado para o endereço: " + emailDigitado);
    }
}

/* ==========================================================================
   MÓDULO 17: INTELIGÊNCIA E VALIDAÇÃO DA TELA DE CADASTRO (NOVO)
   ========================================================================== */
function inicializarLogicaCadastro() {
    const formularioCadastro = document.getElementById("form-cadastro-cliente");
    if (!formularioCadastro) return;

    formularioCadastro.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const nome = document.getElementById("cadastro-nome").value.trim();
        const email = document.getElementById("cadastro-email").value.trim();
        const senha = document.getElementById("cadastro-password").value;
        const confSenha = document.getElementById("cadastro-confirm-password").value;

        // 1. VALIDAÇÃO DE E-MAIL: RegExp estável que aceita o formato name@gmail.com sem quebras de strings
        const regexEmail = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
        if (!regexEmail.test(email)) {
            alert("⚠️ Por favor, insira um e-mail válido contendo '@' e um domínio (Ex: name@gmail.com)!");
            return;
        }

        // 2. VALIDAÇÃO DE SEGURANÇA: Senha forte com no mínimo 6 caracteres
        if (senha.length < 6) {
            alert("⚠️ Por segurança, sua senha deve conter pelo menos 6 caracteres!");
            return;
        }

        // 3. COMPARAÇÃO DE SENHAS: Garante que o usuário digitou a mesma senha nas duas caixas
        if (senha !== confSenha) {
            alert("⚠️ As senhas digitadas não coincidem! Verifique e tente novamente.");
            return;
        }

        // Simulação de salvamento e criação de conta com sucesso
        const sessaoUsuario = {
            logado: true,
            nome: nome.split(" ")[0], // Pega apenas o primeiro nome para saudações
            email: email,
            avatar: "https://dicebear.com" + email
        };

        // Grava o novo usuário ativo na memória do navegador
        localStorage.setItem("cafeteria_usuario_ativo", JSON.stringify(sessaoUsuario));

        alert("Conta criada com sucesso! Seja bem-vindo à nossa cafeteria, " + sessaoUsuario.nome + ".");
        window.location.href = "produtos.html"; // Redireciona para o catálogo de compras
    });
}

/* ==========================================================================
   MÓDULO 18: COMPORTAMENTO DOS OLHOS DE EXIBIÇÃO DE SENHA NO CADASTRO (NOVO)
   ========================================================================== */
function toggleMostrarSenhaCadastro() {
    const botaoOlho = document.getElementById("btn-toggle-senha-cad");
    const inputSenha = document.getElementById("cadastro-password");
    if (!botaoOlho || !inputSenha) return;

    if (inputSenha.type === "password") {
        inputSenha.type = "text";
        botaoOlho.textContent = "🙈";
    } else {
        inputSenha.type = "password";
        botaoOlho.textContent = "👁️";
    }
}

function toggleMostrarConfirmacaoCadastro() {
    const botaoOlho = document.getElementById("btn-toggle-confirm-cad");
    const inputConfSenha = document.getElementById("cadastro-confirm-password");
    if (!botaoOlho || !inputConfSenha) return;

    if (inputConfSenha.type === "password") {
        inputConfSenha.type = "text";
        botaoOlho.textContent = "🙈";
    } else {
        inputConfSenha.type = "password";
        botaoOlho.textContent = "👁️";
    }
}

/* ==========================================================================
   MÓDULO 16: CONTROLE DINÂMICO E HISTÓRICO REAL DA TELA DE PERFIL (CORRIGIDO)
   ========================================================================== */
function inicializarDadosPerfilDinamico() {
    try {
        const cardPerfil = document.getElementById("profile-user-card");
        if (!cardPerfil) return;

        const usuarioLogado = JSON.parse(localStorage.getItem("cafeteria_usuario_ativo"));

        // TRAVA DE SEGURANÇA: Se deslogado, monta o aviso de restrição de forma limpa
        if (!usuarioLogado || !usuarioLogado.logado) {
            cardPerfil.innerHTML = `
                <div style="text-align: center; width: 100%; padding: 30px 10px; display: block !important;">
                    <span style="font-size: 45px; display: block; margin-bottom: 15px;">🔒</span>
                    <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 12px; font-size: 22px; color: var(--text-dark);">Acesso Restrito</h2>
                    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 25px; line-height: 1.5; max-width: 400px; margin-left: auto; margin-right: auto;">
                        Faça login na sua conta para visualizar seus dados cadastrais e o histórico de compras.
                    </p>
                    <button type="button" class="btn-submit" onclick="window.location.href='login.html'" style="max-width: 200px; padding: 12px; font-weight: 600; background-color: var(--bg-dark-brown); color: #fff; border: none; border-radius: 6px; cursor: pointer;">Ir para o Login</button>
                </div>`;
            return;
        }

        // SESSÃO ATIVA: Injeta as informações do perfil do LocalStorage nas tags correspondentes
        document.getElementById("profile-nome").textContent = usuarioLogado.nome || "Cliente Gourmet";
        document.getElementById("profile-email").innerHTML = `<i class="far fa-envelope"></i> ${usuarioLogado.email || "usuario@email.com"}`;
        document.getElementById("profile-telefone").innerHTML = `<i class="fas fa-phone-alt"></i> ${usuarioLogado.telefone || "Telefone não cadastrado"}`;
        
        let enderecoCompleto = "Endereço não cadastrado";
        if (usuarioLogado.endereco) {
            enderecoCompleto = usuarioLogado.endereco + (usuarioLogado.cep ? ", CEP: " + usuarioLogado.cep : "");
        }
        document.getElementById("profile-endereco").innerHTML = `<i class="fas fa-map-marker-alt"></i> ${enderecoCompleto}`;
        
        if (document.getElementById("profile-avatar") && usuarioLogado.avatar) {
            document.getElementById("profile-avatar").setAttribute("src", usuarioLogado.avatar);
        }

        // CHAMADA DO HISTÓRICO REAL DE COMPRAS NA MESMA PÁGINA
        renderizarHistoricoPerfil();

    } catch (erro) {
        console.error("Erro ao carregar dados do perfil:", erro);
    }
}

function renderizarHistoricoPerfil() {
    const containerPerfil = document.getElementById("profile-orders-container");
    if (!containerPerfil) return;

    // Puxa o array com todas as compras salvas na memória local do site
    let historico = JSON.parse(localStorage.getItem("cafeteria_historico_pedidos")) || [];

    if (historico.length === 0) {
        containerPerfil.innerHTML = '<p style="font-size: 13px; color: var(--text-muted); padding: 25px; text-align: center; width: 100%;">Nenhum pedido recente encontrado em sua conta.</p>';
        return;
    }

    containerPerfil.innerHTML = "";
    
    // Filtra e exibe estritamente os 3 últimos pedidos realizados
    historico.slice(0, 3).forEach(pedido => {
        const totalFormatado = pedido.total.toFixed(2).replace(".", ",");
        
        // Puxa com segurança a imagem do primeiro item comprado para servir de capa do cartão
        const imagemCapa = pedido.items && pedido.items[0] ? pedido.items[0].image : "https://unsplash.com";
        
        // CORRIGIDO: O clique do botão agora redireciona com segurança salvando o ID do pedido na URL
        const linhaPerfilHTML = `
            <div class="order-item-row">
                <div class="order-thumb"><img src="${imagemCapa}" alt="Café"></div>
                <div class="order-main-info">
                    <h4>Pedido ${pedido.id}</h4>
                    <p><i class="far fa-calendar"></i> ${pedido.data}</p>
                    <p class="order-total-value"><i class="fas fa-dollar-sign"></i> Total: <strong>R$ ${totalFormatado}</strong></p>
                </div>
                <div class="order-status-box">
                    <span class="status-label">Status</span>
                    <div class="status-badge badge-processing"><i class="far fa-clock"></i> ${pedido.status || "Processando"}</div>
                </div>
                <div class="order-action-box">
                    <button class="btn-order-details" onclick="verDetalhesDoPedidoHistorico('${pedido.id}')">Ver detalhes</button>
                </div>
            </div>`;
        containerPerfil.insertAdjacentHTML("beforeend", linhaPerfilHTML);
    });
}

// FUNÇÃO AUXILIAR MESTRE: Captura o pedido clicado, joga na memória e abre a página de recibo
function verDetalhesDoPedidoHistorico(pedidoId) {
    let historico = JSON.parse(localStorage.getItem("cafeteria_historico_pedidos")) || [];
    let pedidoSelecionado = historico.find(p => p.id === pedidoId);

    if (pedidoSelecionado) {
        // Grava temporariamente como o último pedido ativo para a página de sucesso ler os dados reais
        localStorage.setItem("cafeteria_ultimo_pedido", JSON.stringify(pedidoSelecionado));
        // Redireciona você para a sua tela de recibo existente
        window.location.href = "pedido-confirmado.html";
    } else {
        alert("⚠️ Erro ao recuperar os dados deste pedido.");
    }
}

// FUNÇÃO MESTRE: ALTERNA ENTRE MODO TEXTO E MODO INPUT NA PRÓPRIA TELA
function chavearModoEdicaoDireta() {
    const btnMestre = document.getElementById("btn-mestre-perfil");
    const btnSecundario = document.getElementById("btn-cancelar-logout");
    
    const elNome = document.getElementById("profile-nome");
    const elTelefoneTexto = document.getElementById("profile-telefone-texto");
    const elEnderecoTexto = document.getElementById("profile-endereco-texto");
    const btnDice = document.getElementById("btn-mudar-avatar");

    if (!emModoEdicao) {
        // ENTRANDO NO MODO EDIÇÃO: Transforma h2 e spans em inputs editáveis
        emModoEdicao = true;
        btnMestre.textContent = "Salvar Alterações";
        btnMestre.style.backgroundColor = "var(--success-green)";
        btnSecundario.innerHTML = "Cancelar";
        if (btnDice) btnDice.style.display = "flex";

        // Captura os textos antigos
        const nomeAtual = elNome.textContent;
        const telAtual = elTelefoneTexto.textContent;
        const endAtual = elEnderecoTexto.textContent;

        // Injeta os campos de digitação com os valores antigos dentro deles
        elNome.innerHTML = `<input type="text" id="input-dinamico-nome" class="input-perfil-dinamico" value="${nomeAtual}" style="font-size: 20px; font-weight: 700; width: 100%;">`;
        elTelefoneTexto.innerHTML = `<input type="text" id="input-dinamico-telefone" class="input-perfil-dinamico" value="${telAtual}">`;
        elEnderecoTexto.innerHTML = `<input type="text" id="input-dinamico-endereco" class="input-perfil-dinamico" value="${endAtual}" style="width: 100%;">`;

        // Ativa de forma automática a máscara de telefone no novo input criado
        const inputTelNovo = document.getElementById("input-dinamico-telefone");
        if (inputTelNovo) {
            inputTelNovo.addEventListener("input", (e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (v.length > 0) v = "(" + v;
                if (v.length > 3) v = v.replace(/^(\(\d{2})(\d)/, "\$1) \$2");
                if (v.length > 9) v = v.replace(/(\d{5})(\d{4})\$/, "\$1-\$2");
                else if (v.length > 8) v = v.replace(/(\d{4})(\d{4})\$/, "\$1-\$2");
                e.target.value = v;
            });
        }
    } else {
        // SALVANDO ALTERAÇÕES: Captura o que o usuário digitou e grava na memória
        const valorNome = document.getElementById("input-dinamico-nome").value.trim();
        const valorTelefone = document.getElementById("input-dinamico-telefone").value.trim();
        const valorEndereco = document.getElementById("input-dinamico-endereco").value.trim();

        if (valorNome.length < 2) {
            alert("⚠️ Por favor, insira um nome válido.");
            return;
        }

        let usuarioLogado = JSON.parse(localStorage.getItem("cafeteria_usuario_ativo")) || {};
        usuarioLogado.nome = valorNome;
        usuarioLogado.telefone = valorTelefone;
        usuarioLogado.endereco = valorEndereco;
        usuarioLogado.avatar = document.getElementById("profile-avatar").getAttribute("src");

        localStorage.setItem("cafeteria_usuario_ativo", JSON.stringify(usuarioLogado));

        // Desativa o modo edição e reconstrói as tags como texto travado limpo
        emModoEdicao = false;
        btnMestre.textContent = "Editar Perfil";
        btnMestre.style.backgroundColor = "var(--bg-dark-brown)";
        btnSecundario.innerHTML = `<i class="fas fa-sign-out-alt"></i> Sair da Conta`;
        if (btnDice) btnDice.style.display = "none";

        elNome.textContent = valorNome;
        elTelefoneTexto.textContent = valorTelefone;
        elEnderecoTexto.textContent = valorEndereco;

        alert("Seus dados cadastrais foram salvos diretamente no sistema!");
    }
}

// AÇÃO DO BOTÃO SECUNDÁRIO (Se estiver editando cancela, se estiver em leitura desloga)
function gerenciarBotaoSecundario() {
    if (emModoEdicao) {
        // Cancelar: Desativa tudo e recarrega os dados antigos da memória
        emModoEdicao = false;
        const btnMestre = document.getElementById("btn-mestre-perfil");
        btnMestre.textContent = "Editar Perfil";
        btnMestre.style.backgroundColor = "var(--bg-dark-brown)";
        document.getElementById("btn-cancelar-logout").innerHTML = `<i class="fas fa-sign-out-alt"></i> Sair da Conta`;
        if (document.getElementById("btn-mudar-avatar")) document.getElementById("btn-mudar-avatar").style.display = "none";
        inicializarDadosPerfilDinamico();
    } else {
        // Sair da conta normal
        efetuarLogout();
    }
}

// GERA NOVO ROBOZINHO DE AVATAR ALEATÓRIO SE O USUÁRIO CLICAR NO DADO (🎲)
function gerarNovoAvatarAleatorio() {
    const sementes = ["coffeebot", "gourmet", "mocha", "latte", "roaster", "espresso", "beans", "cup"];
    const sementeSorteada = sementes[Math.floor(Math.random() * sementes.length)] + Math.floor(Math.random() * 100);
    const novoLinkAvatar = `https://dicebear.com{sementeSorteada}`;
    
    const elAvatar = document.getElementById("profile-avatar");
    if (elAvatar) elAvatar.setAttribute("src", novoLinkAvatar);
}

function efetuarLogout() {
    if (confirm("Deseja realmente encerrar sua sessão e sair da conta?")) {
        localStorage.removeItem("cafeteria_usuario_ativo");
        alert("Sessão encerrada!");
        window.location.href = "login.html";
    }
}
