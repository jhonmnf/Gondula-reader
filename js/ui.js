export const formatarPreco = valor =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const setHidden = (id, value) => {
  const el = document.querySelector(id);
  if (!el) return;
  el.hidden = value;
};

export const mensagem = (texto, tipo = 'info') => {
  const el = document.querySelector('#mensagem');
  if (!el) return;
  el.textContent = texto;

  if (tipo === 'erro') {
    el.classList.add('mensagem--erro');
    setTimeout(() => el.classList.remove('mensagem--erro'), 500);
  } else {
    el.classList.remove('mensagem--erro');
  }
};

export function exibirListaProdutos(produtos) {
  setHidden('#estado-inicial', true);
  setHidden('#produto', true);
  setHidden('#leitura', true);

  const container = document.querySelector('#resultados-grade');
  container.innerHTML = '';

  produtos.forEach(p => {
    const item = document.createElement('div');
    item.className = 'produto-item';
    item.innerHTML = `
      <span class="nome">${p.nome}</span>
      <div class="info">
        <span>${p.codigo}</span>
        <span class="preco">${formatarPreco(p.preco)}</span>
      </div>
    `;
    item.onclick = () => {
        // Emit custom event to be handled by app.js
        window.dispatchEvent(new CustomEvent('produto-selecionado', { detail: p }));
    };
    container.appendChild(item);
  });

  setHidden('#lista-resultados', false);
}

export function exibirProduto(produto) {
  setHidden('#estado-inicial', true);
  setHidden('#lista-resultados', true);
  setHidden('#leitura', true);

  document.querySelector('#codigo-produto').textContent = produto.codigo;
  document.querySelector('#nome-produto').textContent = produto.nome;
  document.querySelector('#detalhe-produto').textContent = produto.detalhe;
  document.querySelector('#preco-produto').textContent = formatarPreco(produto.preco);

  const elProduto = document.querySelector('#produto');
  elProduto.hidden = false;
  elProduto.style.display = 'block';

  elProduto.classList.remove('produto--animar');
  void elProduto.offsetWidth;
  elProduto.classList.add('produto--animar');
  elProduto.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
