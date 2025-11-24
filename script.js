// Variáveis Globais
const areaResultados = document.getElementById('containerResultados');
const filtroEscolaridade = document.getElementById('filtro-escolaridade');
const filtroCidade = document.getElementById('filtroCidade');
let dadosConcursos = []; // Armazena os dados brutos do JSON

// -------------------------------------------------------------------
// FUNÇÃO AUXILIAR PARA NORMALIZAÇÃO
// -------------------------------------------------------------------

// Função auxiliar para remover acentos e caracteres especiais
function normalizarString(str) {
    if (!str) return '';
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}


// -------------------------------------------------------------------
// 1. FUNÇÃO PRINCIPAL PARA CARREGAR E EXIBIR OS DADOS
// -------------------------------------------------------------------

async function carregaDados() {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar o JSON: ${response.statusText}`);
        }
        dadosConcursos = await response.json();
        
        // Exibe todos os cards imediatamente após o carregamento
        exibirResultados(dadosConcursos); 
        
        // Popula os filtros de cidades E ESCOLARIDADE após carregar os dados
        popularFiltroCidades(); 
        popularFiltroEscolaridade(); // <--- NOVO: Chama a função de escolaridade
        
        // Adiciona listeners para acionar a busca ao interagir com os filtros
        // O listener de 'change' para escolaridade já está no HTML
        
        if(filtroCidade) {
            filtroCidade.addEventListener('change', aplicarFiltros);
        }
        
        // Listener para o campo de texto (busca em tempo real ao digitar)
        document.getElementById('buscaTexto').addEventListener('input', aplicarFiltros);


    } catch (error) {
        console.error("Houve um problema ao carregar os dados:", error);
        areaResultados.innerHTML = `<p class="erro-mensagem">Não foi possível carregar os dados dos concursos. Por favor, verifique o arquivo data.json.</p>`;
    }
}

// -------------------------------------------------------------------
// 2. FUNÇÃO PARA CRIAR O CARD INDIVIDUAL
// -------------------------------------------------------------------

function criaCardResultado(item) {
    const dataFimFormatada = new Date(item.data_inscricao_fim).toLocaleDateString('pt-BR');
    const dataInicioFormatada = new Date(item.data_inscricao_inicio).toLocaleDateString('pt-BR');
    const etapasFormatadas = item.etapas.join(', '); 

    const card = document.createElement('article');
    card.classList.add('card-concurso'); 
    card.innerHTML = `
        <div class="card-header">
            <h3>${item.cargo_base}</h3>
        </div>

        <div class="card-orgao-info">
            <p class="orgao-tag">${item.orgao}</p>
        </div>
        
        <div class="card-metrica">
            <p>Salário: <span>R$ ${item.salario_min.toFixed(2).replace('.', ',')}</span></p>
            <p>Vagas: <span>${item.vagas_total} + CR</span></p>
            <p>Local: <span>${item.cidade_uf}</span></p>
        </div>
        
        <div class="card-tags-detalhes">
            <span class="tag-escolaridade">${item.escolaridade}</span>
            <span class="tag-etapas">${etapasFormatadas}</span>
        </div>
        
        <div class="card-inscricao-detalhe">
            <p>Inscrições: <span>De ${dataInicioFormatada} até ${dataFimFormatada}</span></p>
        </div>
        
        <a href="${item.link_edital}" target="_blank" class="botao-edital">
            Ver Edital
        </a>
    `;
    return card;
}

// -------------------------------------------------------------------
// 3. FUNÇÃO PARA EXIBIR TODOS OS CARDS (SEM LIMITE)
// -------------------------------------------------------------------

function exibirResultados(resultados) {
    areaResultados.innerHTML = ''; 
    
    // NENHUM LIMITE APLICADO: exibe todos os resultados
    if (resultados.length === 0) {
        areaResultados.innerHTML = `<p class="alerta-mensagem">Nenhum concurso encontrado para os filtros selecionados. Tente refinar sua busca.</p>`;
        return;
    }
    
    resultados.forEach(item => {
        const card = criaCardResultado(item);
        areaResultados.appendChild(card);
    });
}

// -------------------------------------------------------------------
// 4. FUNÇÕES PARA POPULAR OS SELECTS DINAMICAMENTE
// -------------------------------------------------------------------

function popularFiltroCidades() {
    const filtroCidadeElemento = document.getElementById('filtroCidade');
    
    // 1. Coleta cidades únicas
    const cidadesUnicas = new Set();
    dadosConcursos.forEach(item => {
        cidadesUnicas.add(item.cidade_uf);
    });

    // 2. Transforma o Set em Array e ordena alfabeticamente
    const cidadesOrdenadas = Array.from(cidadesUnicas).sort();

    // 3. Limpa todas as opções, exceto a primeira (opção "Todas as Cidades")
    if (filtroCidadeElemento) {
        while (filtroCidadeElemento.options.length > 1) {
            filtroCidadeElemento.remove(1);
        }

        // 4. Cria e adiciona as novas opções
        cidadesOrdenadas.forEach(cidade => {
            const option = document.createElement('option');
            option.value = cidade;
            option.textContent = cidade;
            filtroCidadeElemento.appendChild(option);
        });
    }
}

/**
 * NOVO: Popula o filtro de escolaridade com base nos valores únicos do JSON.
 */
function popularFiltroEscolaridade() {
    const filtroEscolaridadeElemento = document.getElementById('filtro-escolaridade');
    
    // 1. Coleta escolaridades únicas
    const escolaridadesUnicas = new Set();
    dadosConcursos.forEach(item => {
        if (item.escolaridade && item.escolaridade.trim() !== '') {
            escolaridadesUnicas.add(item.escolaridade.trim());
        }
    });

    // 2. Transforma o Set em Array e ordena (opcional, mas bom para UX)
    const escolaridadesOrdenadas = Array.from(escolaridadesUnicas).sort();

    // 3. Limpa todas as opções, exceto a primeira (opção "Todos")
    if (filtroEscolaridadeElemento) {
        while (filtroEscolaridadeElemento.options.length > 1) {
            filtroEscolaridadeElemento.remove(1);
        }

        // 4. Cria e adiciona as novas opções
        escolaridadesOrdenadas.forEach(escolaridade => {
            const option = document.createElement('option');
            // O valor e o texto são a string exata do JSON
            option.value = escolaridade;
            option.textContent = escolaridade;
            filtroEscolaridadeElemento.appendChild(option);
        });
    }
}


// -------------------------------------------------------------------
// 5. FUNÇÃO PARA APLICAR TODOS OS FILTROS
// -------------------------------------------------------------------

function aplicarFiltros() {
    // 1. Coleta dados e normaliza a busca por texto
    const textoBuscaNormalizado = normalizarString(document.getElementById('buscaTexto').value);
    const escolaridadeBusca = document.getElementById('filtro-escolaridade').value;
    const cidadeBusca = document.getElementById('filtroCidade').value;
    
    let resultadosFiltrados = dadosConcursos.filter(item => {
        
        // Normalização dos campos do JSON
        const cargoNormalizado = normalizarString(item.cargo_base);
        const orgaoNormalizado = normalizarString(item.orgao);

        // A. Filtro por Texto (Cargo ou Órgão)
        const buscaTextoPassou = textoBuscaNormalizado === "" || cargoNormalizado.includes(textoBuscaNormalizado) || orgaoNormalizado.includes(textoBuscaNormalizado);
        
        // B. Filtro por Escolaridade
        let escolaridadePassou = false;
        
        if (escolaridadeBusca === 'todos') {
            escolaridadePassou = true;
        } else {
            // AGORA, a comparação é direta, pois o valor do filtro é EXATO
            // ao que está no JSON.
            escolaridadePassou = item.escolaridade === escolaridadeBusca;
        }
        
        // C. Filtro por Cidade
        const cidadePassou = !cidadeBusca || cidadeBusca === "" || item.cidade_uf === cidadeBusca;

        return buscaTextoPassou && escolaridadePassou && cidadePassou;
    });

    exibirResultados(resultadosFiltrados);
}

// -------------------------------------------------------------------
// 6. INICIALIZAÇÃO
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', carregaDados);