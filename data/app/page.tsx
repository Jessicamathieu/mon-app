import data from '../data/data.json';

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Bienvenue sur mon app de gestion !</h1>
      <p>Voici la liste de mes clients :</p>
      <ul>
        {data.clients.map((client) => (
          <li key={client.id}>
            {client.nom} - {client.email}
          </li>
        ))}
      </ul>
    </main>
  );
}
