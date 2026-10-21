// api/criar-checkout.js
export default async function handler(req, res) {
    // Libera o acesso para que o seu site no GitHub Pages consiga conversar com este servidor
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

        // SUBSTITUA PELA SUA CREDENCIAL DE TESTE OU PRODUÇÃO DO MERCADO PAGO
        // Pegue essa chave no painel: Mercado Pago Developers > Suas Aplicações > Credenciais
        const MERCADO_PAGO_TOKEN = process.env.MERCADO_PAGO_TOKEN || "TEST-712839213890213-YOUR-ACCESS-TOKEN";

        // Prepara a lista de produtos formatada exatamente como o Mercado Pago exige
        const itensFormatados = itens.map(item => ({
            id: item.id,
            title: item.name,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.price),
            currency_id: "BRL",
            picture_url: item.image
        }));

        // Adiciona a taxa fixa de frete do seu e-commerce como um item extra
        itensFormatados.push({
            id: "frete-fixo",
            title: "Taxa de Entrega (Frete)",
            quantity: 1,
            unit_price: 9.90,
            currency_id: "BRL"
        });

        // Configura as preferências da transação segura
        const preferenciaConfig = {
            items: itensFormatados,
            payer: {
                email: emailUsuario || "cliente@email.com"
            },
            // Links para onde o cliente será mandado de volta após pagar de verdade
            back_urls: {
                // SUBSTITUA COM O LINK REAL DO SEU SITE HOSPEDADO NO GITHUB PAGES:
                success: "https://github.io",
                failure: "https://github.io",
                pending: "https://github.io"
            },
            auto_return: "approved",
            // Filtra os meios de pagamento para aceitar apenas PIX e Cartão de Crédito
            payment_methods: {
                excluded_payment_types: [
                    { id: "ticket" } // Exclui boleto bancário (demora a compensar)
                ],
                installments: 12 // Permite parcelamento em até 12x no cartão
            }
        };

        // Dispara a requisição criptografada para os servidores do Mercado Pago
        const respostaMP = await fetch("https://mercadopago.com", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MERCADO_PAGO_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(preferenciaConfig)
        });

        const dadosPreferencia = await respostaMP.json();

        if (dadosPreferencia.init_point) {
            // Retorna o link oficial e seguro do checkout criptografado para o front-end
            return res.status(200).json({ urlCheckout: dadosPreferencia.init_point });
        } else {
            return res.status(400).json({ erro: "Erro ao gerar preferência no Mercado Pago", detalhes: dadosPreferencia });
        }

    } catch (erro) {
        return res.status(500).json({ erro: "Erro interno no servidor", detalhe: erro.message });
    }
}
