/* ==========================================================================
   SERVIDO BACK-END: PROCESSAMENTO SEGURO MERCADO PAGO (100% CORRIGIDO)
   ========================================================================== */
export default async function handler(req, res) {
    // 1. BLINDAGEM CORS: Libera o tráfego seguro para o seu site do GitHub Pages consumir a API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    try {
        const { itens, emailUsuario } = req.body;

        // 2. CAPTURA DO TOKEN OCULTO: Lê a variável configurada no painel da Vercel
        const MERCADO_PAGO_TOKEN = process.env.MERCADO_PAGO_TOKEN;

        if (!MERCADO_PAGO_TOKEN) {
            return res.status(500).json({ 
                erro: "⚙️ Erro de Configuração no Back-end", 
                detalhes: "A variável MERCADO_PAGO_TOKEN não foi detectada nas variáveis da Vercel." 
            });
        }

        // Formata o pacote de itens para o padrão exigido pela engenharia do Mercado Pago
        const itensFormatados = itens.map(item => ({
            id: item.id,
            title: item.name,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.price),
            currency_id: "BRL",
            picture_url: item.image
        }));

        // Insere a taxa de entrega fixa do carrinho como item
        itensFormatados.push({
            id: "frete-fixo",
            title: "Taxa de Entrega (Frete)",
            quantity: 1,
            unit_price: 9.90,
            currency_id: "BRL"
        });

        // 3. CONFIGURAÇÃO DE RETORNO DO GITHUB PAGES:
        // IMPORTANTE: Substitua o termo 'seu-usuario' abaixo pelo seu nome de perfil real do GitHub!
        const preferenciaConfig = {
            items: itensFormatados,
            payer: {
                email: emailUsuario || "cliente@email.com"
            },
            back_urls: {
                success: "https://github.io",
                failure: "https://github.io",
                pending: "https://github.io"
            },
            auto_return: "approved",
            payment_methods: {
                excluded_payment_types: [
                    { id: "ticket" } // Bloqueia boletos para o PIX e Cartão rodarem rápido
                ],
                installments: 12
            }
        };

        // 4. CORREÇÃO DA ENDPOINT DA API: Conecta de verdade aos servidores de transação do Mercado Pago
        const respostaMP = await fetch("https://mercadopago.com", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MERCADO_PAGO_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(preferenciaConfig)
        });

        const dadosPreferencia = await respostaMP.json();

        // Se o token estiver ativo e as permissões certas, devolve o link criptografado (init_point)
        if (dadosPreferencia.init_point) {
            return res.status(200).json({ urlCheckout: dadosPreferencia.init_point });
        } else {
            return res.status(400).json({ erro: "Erro ao gerar preferência no Mercado Pago", detalhes: dadosPreferencia });
        }

    } catch (erro) {
        return res.status(500).json({ erro: "Erro interno no servidor", detalhe: erro.message });
    }
}
