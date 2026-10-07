import { useQuestionBanks } from '../hooks/useQuestionBanks';

/**
 * Lista os bancos de perguntas disponiveis (os proprios e os publicados por
 * outros instrutores) e copia as perguntas escolhidas para o jogo em edicao.
 *
 * As perguntas sao COPIADAS com ids novos: editar o jogo depois nao altera o
 * banco de origem, e importar o mesmo banco duas vezes nao colide.
 */
export default function QuestionBankPicker({ onImport }) {
  const { myBanks, publicBanks } = useQuestionBanks();

  const importFrom = (bank) => {
    const copies = (bank.questions || []).map((q) => ({
      ...q,
      id: `${bank.id}-${q.id}`,
    }));
    onImport(copies);
  };

  const renderList = (banks, emptyMessage) => (
    banks.length === 0
      ? <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>{emptyMessage}</p>
      : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {banks.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                background: 'rgba(0,0,0,0.25)', border: '1px solid var(--panel-b)',
                borderRadius: '8px', padding: '12px 16px',
              }}
            >
              <div>
                <div style={{ fontWeight: '700' }}>{b.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {(b.questions || []).length} pergunta(s)
                  {b.ownerName ? ` · por ${b.ownerName}` : ''}
                  {b.isPublic ? ' · público' : ' · privado'}
                </div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => importFrom(b)}>
                Importar
              </button>
            </div>
          ))}
        </div>
      )
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="input-label">Meus bancos</span>
        {renderList(myBanks, 'Voce ainda nao publicou nenhum banco.')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="input-label">Bancos compartilhados por outros instrutores</span>
        {renderList(publicBanks, 'Nenhum banco publico disponivel no momento.')}
      </div>
    </div>
  );
}
