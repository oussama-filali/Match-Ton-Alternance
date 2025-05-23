export default function Card({ offer, score }) {
  console.log(offer);
  return (
    <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition">
      <h3 className="text-xl font-semibold text-blue-700 mb-2">{offer.title}</h3>
      <p className="text-gray-600 text-sm mb-2">{offer.description}</p>
      <p className="text-gray-500 text-sm">
        <strong>Stack:</strong> {offer.stack?.join(", ")}
      </p>
      <p className="text-gray-500 text-sm mb-4">
        <strong>Compétences:</strong> {offer.skills?.join(", ")}
      </p>
      <p className="font-bold text-green-600">
        🔍 Score de matching : {score}%
      </p>
      <div className="mt-3 flex gap-3">
        <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
          Je postule
        </button>
        <button className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm">
          Ignorer
        </button>
      </div>
    </div>
  );
}
