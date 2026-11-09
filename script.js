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
    try {
        if (document.getElementById("detail-product-name")) {
            inicializarPaginaDetalhesDinamica();
        }
    } catch (erro) {
        console.error("Erro ao rodar o motor de detalhes:", erro);
    }
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
   3. MÓDULO: RENDERIZAÇÃO DINÂMICA DA TELA DE MEU CARRINHO (CORTADO RESOLVIDO)
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
                salvarERenderizar(carrinho);
            }
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
    const subtotal = carrinho.reduce((acc, item) => acumulador = acc + (item.price * item.quantity), 0);
    atualizarValoresFinanceiros(subtotal);
}

function atualizarValoresFinanceiros(subtotal) {
    const elSubtotal = document.getElementById("cart-subtotal");
    const elTotal = document.getElementById("cart-total");
    
    if (elSubtotal) elSubtotal.textContent = "R$ " + subtotal.toFixed(2).replace(".", ",");
    if (elTotal) elTotal.textContent = "R$ " + subtotal.toFixed(2).replace(".", ",");
}

/* ==========================================================================
   4. OUTRAS COMPONENTES OPERACIONAIS DE PREVENÇÃO DE ERROS
   ========================================================================== */
function renderizarBarraUsuarioNavbar() {
    const userBlock = document.getElementById("navbar-user-block");
    if (!userBlock) return;
    const sessao = JSON.parse(localStorage.getItem("cafeteria_usuario_ativo"));
    if (sessao && sessao.logado) {
    userBlock.innerHTML = <span>Olá, ${localStorage.getItem("perfil_nome") || 'Cliente'}</span>;
}
}
function renderizarCheckout() {
const container = document.getElementById("checkout-items-container");
if (!container) return;
let carrinho = JSON.parse(localStorage.getItem("cafeteria_carrinho")) || [];
container.innerHTML = "";
carrinho.forEach(item => {
container.innerHTML += <p>${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}</p>;
});
}
function renderizarPaginaSucesso() {
localStorage.removeItem("cafeteria_carrinho");
atualizarContadorMenu();
}
function inicializarFiltrosProdutos() {}
function inicializarFaixaPrecoInterativa() {}
function renderizarHistoricoCompleto() {}
function renderizarHistoricoPerfil() {}
function renderizarDetalhesDoPedido() {}
function inicializarGaleriaDetalhes() {}
function inicializarPainelAdmin() {}
function inicializarFormularioCadastroAdmin() {}
function inicializarLogicaLogin() {}
function inicializarLogicaCadastro() {}
function inicializarDadosPerfilDinamico() {}
function inicializarFormularioAlterarPerfil() {}
function inicializarPaginaDetalhesDinamica() {}

/* ==========================================================================
   LOGICA DINÂMICA DE LOGIN E CONTROLE INTERATIVO DO PROTÓTIPO
   ========================================================================== */

function fazerLoginAgora() {
            var campoEmail = document.getElementById("login-email");
            var emailDigitado = campoEmail ? campoEmail.value.trim() : "";
            var emailFinal = emailDigitado || localStorage.getItem("perfil_email") || "cliente@cafeteriagourmet.com";
            var nomeSalvo = localStorage.getItem("perfil_nome");

            localStorage.setItem("cafeteria_usuario_ativo", JSON.stringify({
                logado: true,
                email: emailFinal
            }));

            if (!nomeSalvo || nomeSalvo === "Seu Nome") {
                localStorage.setItem("perfil_nome", "Cliente Gourmet");
                localStorage.setItem("perfil_email", emailFinal);
                localStorage.setItem("perfil_phone", "(61) 99999-9999");
                localStorage.setItem("perfil_address", "Seu endereço completo aparecerá aqui");
            } else {
                localStorage.setItem("perfil_email", emailFinal);
            }

            var btn = document.getElementById("btn-login-submit");
            if (btn) {
                btn.textContent = "✓ Entrando...";
                btn.style.backgroundColor = "#28a745";
            }

            setTimeout(function() {
                window.location.assign("./perfil.html");
            }, 500);
        }

        // Ativa o ícone de olho da senha
        var iconeOlho = document.getElementById("toggle-password-icon");
        var campoSenha = document.getElementById("login-password");
        if (iconeOlho && campoSenha) {
            iconeOlho.onclick = function() {
                if (campoSenha.type === "password") {
                    campoSenha.type = "text";
                    iconeOlho.classList.remove("fa-eye");
                    iconeOlho.classList.add("fa-eye-slash");
                } else {
                    campoSenha.type = "password";
                    iconeOlho.classList.remove("fa-eye-slash");
                    iconeOlho.classList.add("fa-eye");
                }
            };
        }

/* ==========================================================================
   LÓGICA DINÂMICA DE CADASTRO (VÍNCULO DIRETO POR ID)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function() {
    var btnCriar = document.getElementById("btn-criar-conta");
    var eyeIcon = document.getElementById("toggle-cadastro-password");
    var passwordInput = document.getElementById("cadastro-password");

    // 1. Ação de clique no botão "Criar conta"
    if (btnCriar) {
        btnCriar.addEventListener("click", function(evento) {
            evento.preventDefault(); // Evita qualquer recarregamento acidental

            var nomeInput = document.getElementById("cadastro-name").value.trim();
            var emailInput = document.getElementById("cadastro-email").value.trim();
            var phoneInput = document.getElementById("cadastro-phone").value.trim();
            var senhaInput = document.getElementById("cadastro-password").value.trim();

            if (!nomeInput || !emailInput || !phoneInput || !senhaInput) {
                alert("⚠️ Por favor, preencha todos os campos antes de criar sua conta!");
                return;
            }

            // Salva os dados no LocalStorage para aparecerem no Perfil e no Admin
            localStorage.setItem("perfil_nome", nomeInput);
            localStorage.setItem("perfil_email", emailInput);
            localStorage.setItem("perfil_phone", phoneInput);
            localStorage.setItem("perfil_address", "Seu endereço completo aparecerá aqui");

            // Feedback visual no botão e redirecionamento
            btnCriar.textContent = "✓ Conta criada! Redirecionando...";
            btnCriar.style.backgroundColor = "#28a745";

            setTimeout(function() {
                window.location.href = "./login.html";
            }, 1000);
        });
    }

    // 2. Funcionalidade do ícone de olho na senha
    if (eyeIcon && passwordInput) {
        eyeIcon.addEventListener("click", function() {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                eyeIcon.classList.remove("fa-eye");
                eyeIcon.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                eyeIcon.classList.remove("fa-eye-slash");
                eyeIcon.classList.add("fa-eye");
            }
        });
    }
});

        function registrarNovoCliente() {
            var nome = document.getElementById("cadastro-name").value.trim();
            var email = document.getElementById("cadastro-email").value.trim();
            var telefone = document.getElementById("cadastro-phone").value.trim();
            var senha = document.getElementById("cadastro-password").value.trim();

            if (!nome || !email || !telefone || !senha) {
                alert("⚠️ Preencha todos os campos antes de continuar!");
                return;
            }

            localStorage.setItem("perfil_nome", nome);
            localStorage.setItem("perfil_email", email);
            localStorage.setItem("perfil_phone", telefone);
            localStorage.setItem("perfil_address", "Seu endereço completo aparecerá aqui");

            var btn = document.getElementById("btn-criar-conta");
            btn.textContent = "✓ Conta criada! Redirecionando...";
            btn.style.backgroundColor = "#28a745";

            setTimeout(function() {
                window.location.assign("./login.html");
            }, 600);
        }

        function alternarSenhaCadastro(icone) {
            var input = document.getElementById("cadastro-password");
            if (input.type === "password") {
                input.type = "text";
                icone.classList.remove("fa-eye");
                icone.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                icone.classList.remove("fa-eye-slash");
                icone.classList.add("fa-eye");
            }
        }