

const AboutPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="max-w-3xl bg-white shadow-lg rounded-lg p-6">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">Sobre Nós</h1>
                <p className="text-gray-700 text-lg mb-4">
                    Bem-vindo ao nosso site de comércio eletrônico, criado para tornar as compras no supermercado mais
                    fáceis e rápidas para você! Aqui, você pode explorar e comprar mercadorias de qualquer supermercado
                    que desejar, tudo em um só lugar.
                </p>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Como Funciona</h2>
                <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                    <li>
                        <strong>Escolha o Supermercado:</strong> Navegue pelos supermercados disponíveis e selecione o que
                        melhor atende às suas necessidades.
                    </li>
                    <li>
                        <strong>Adicione Itens ao Carrinho:</strong> Explore os produtos, escolha o que precisa e adicione-os ao seu
                        carrinho de compras.
                    </li>
                    <li>
                        <strong>Preencha Suas Informações:</strong> Após finalizar suas escolhas, insira seu nome e as
                        informações necessárias.
                    </li>
                    <li>
                        <strong>Receba o Custo Total:</strong> O custo total será calculado e exibido para você antes de
                        finalizar a compra.
                    </li>
                    <li>
                        <strong>Envie para o WhatsApp:</strong> Com apenas um clique, você pode enviar seu pedido
                        diretamente para o WhatsApp.
                    </li>
                </ol>

                <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Nossa Missão</h2>
                <p className="text-gray-700 text-lg">
                    Este site foi desenvolvido para facilitar a entrega de mercadorias de supermercado, economizando seu
                    tempo e esforço. Com apenas alguns cliques, você pode comprar tudo o que precisa e receber seus itens
                    em minutos, sem sair de casa.
                </p>

                <p className="text-gray-700 text-lg mt-4">
                    Acreditamos em oferecer conveniência e praticidade para tornar sua experiência de compra ainda melhor.
                </p>
            </div>
        </div>
    );
};

export default AboutPage;
