// frontend/src/pages/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../componentes/Navbar';
import ChatMessage from '../componentes/ChatMessage';
import api from '../servicos/api';
import toast from 'react-hot-toast';

interface Mensagem {
    texto: string;
    isUser: boolean;
    timestamp: Date;
}

// Função de fallback local para quando a API falha
const getLocalResponse = (mensagem: string): string => {
    const msg = mensagem.toLowerCase();

    if (msg.includes('listar produtos') || msg.includes('ver produtos') || msg.includes('mostrar produtos')) {
        return "📦 **Para ver a lista de produtos, por favor, acesse o Dashboard!**\n\nVocê pode ver todos os produtos cadastrados clicando em 'Produtos' no menu superior.\n\n💡 *Dica: Se ainda não tem produtos, use o botão 'Gerar com IA' para criar automaticamente!*";
    }

    if (msg.includes('preço') || msg.includes('precificação')) {
        return "💰 **Dicas de Precificação**\n\n1. Pesquise seus concorrentes\n2. Calcule todos os custos\n3. Defina sua margem de lucro (mínimo 30%)\n4. Use preços psicológicos (R$ 99,90)\n5. Ofereça descontos para pagamento à vista\n\n💡 *Quer ajuda mais específica? Acesse o Dashboard e veja seus produtos!*";
    }

    if (msg.includes('escalar') || msg.includes('vender mais')) {
        return "📈 **Como Escalar Vendas**\n\n🚀 **Estratégias:**\n• Invista em anúncios online\n• Crie um programa de indicação\n• Use WhatsApp Business\n• Faça parcerias com influenciadores\n• Ofereça frete grátis\n\n💡 *Quer implementar alguma dessas estratégias? Posso ajudar!*";
    }

    if (msg.includes('descrição')) {
        return "✍️ **Dicas para Descrições que Vendem**\n\n✅ Destaque os benefícios\n✅ Use palavras que despertam emoção\n✅ Seja específico sobre características\n✅ Inclua garantia e diferenciais\n✅ Adicione prova social\n\n💡 *Exemplo: 'Este produto vai transformar sua rotina...'*";
    }

    return "🤖 **Olá! Como posso ajudar?**\n\n📦 **Listar produtos** - Veja todos os produtos\n💰 **Precificação** - Dicas de preços\n📈 **Escalar vendas** - Estratégias de crescimento\n✍️ **Descrições** - Melhore seus textos\n\nO que você gostaria de saber?";
};

const Chat: React.FC = () => {
    const [mensagens, setMensagens] = useState<Mensagem[]>([
        {
            texto: 'Olá! Sou o assistente virtual. Posso ajudar com:\n\n📦 Informações de produtos\n💰 Estratégias de precificação\n📈 Como escalar vendas\n✍️ Melhorar descrições de produtos\n\nComo posso ajudar você hoje?',
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputMensagem, setInputMensagem] = useState('');
    const [enviando, setEnviando] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensagens]);

    useEffect(() => {
        if (inputRef.current && !enviando) {
            inputRef.current.focus();
        }
    }, [enviando, mensagens]);

    const enviarMensagem = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputMensagem.trim() || enviando) return;

        const mensagemUsuario: Mensagem = {
            texto: inputMensagem,
            isUser: true,
            timestamp: new Date(),
        };

        const mensagemAtual = inputMensagem;
        setMensagens(prev => [...prev, mensagemUsuario]);
        setInputMensagem('');
        setEnviando(true);

        try {
            const response = await api.post('/chat', { mensagem: mensagemAtual });

            const respostaIA: Mensagem = {
                texto: response.data.mensagem,
                isUser: false,
                timestamp: new Date(response.data.timestamp),
            };
            setMensagens(prev => [...prev, respostaIA]);
        } catch (error: any) {
            console.error('Erro no chat:', error);

            // Usar resposta local como fallback
            const respostaLocal = getLocalResponse(mensagemAtual);
            const respostaFallback: Mensagem = {
                texto: respostaLocal,
                isUser: false,
                timestamp: new Date(),
            };
            setMensagens(prev => [...prev, respostaFallback]);

            toast.error('Erro ao conectar com IA, usando resposta local');
        } finally {
            setEnviando(false);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    };

    const sugestaoRapida = (texto: string) => {
        setInputMensagem(texto);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className="chat-page">
            <Navbar />
            <div className="chat-container">
                <div className="chat-wrapper">
                    <div className="chat-header">
                        <div className="chat-header-content">
                            <div className="chat-header-icon">
                                <svg className="chat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor" />
                                    <circle cx="8" cy="10" r="2" fill="white" />
                                    <circle cx="12" cy="10" r="2" fill="white" />
                                    <circle cx="16" cy="10" r="2" fill="white" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="chat-title">Assistente Virtual IA</h2>
                                <p className="chat-subtitle">
                                    Converse sobre produtos, vendas e estratégias
                                </p>
                            </div>
                        </div>
                        <div className="chat-status">
                            <span className="status-dot"></span>
                            <span className="status-text">Online</span>
                        </div>
                    </div>

                    <div className="chat-sugestoes">
                        <button onClick={() => sugestaoRapida("Quero dicas para escalar minhas vendas")} className="sugestao-btn">
                            🚀 Como escalar vendas?
                        </button>
                        <button onClick={() => sugestaoRapida("Me ajude com precificação de produtos")} className="sugestao-btn">
                            💰 Dicas de precificação
                        </button>
                        <button onClick={() => sugestaoRapida("Crie uma descrição melhor para meu produto")} className="sugestao-btn">
                            ✍️ Melhorar descrição
                        </button>
                        <button onClick={() => sugestaoRapida("Listar produtos disponíveis")} className="sugestao-btn">
                            📦 Ver produtos
                        </button>
                    </div>

                    <div className="chat-messages-area">
                        <div className="chat-messages">
                            {mensagens.map((msg, index) => (
                                <ChatMessage
                                    key={index}
                                    message={msg.texto}
                                    isUser={msg.isUser}
                                    timestamp={msg.timestamp}
                                />
                            ))}
                            {enviando && (
                                <div className="message-bot">
                                    <div className="message-bot-bubble">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <form onSubmit={enviarMensagem} className="chat-input-form">
                        <div className="chat-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMensagem}
                                onChange={(e) => setInputMensagem(e.target.value)}
                                placeholder="Digite sua mensagem... (Pressione Enter para enviar)"
                                className="chat-input"
                                disabled={enviando}
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={enviando || !inputMensagem.trim()}
                                className="chat-send-button"
                            >
                                <svg className="send-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;