import SpellChecker from "./components/SpellChecker";

const languages = [
	{
		name: "English",
		key: "en",
	},
	// {
	// 	name: "French",
	// 	key: "fr",
	// },
	// {
	// 	name: "Italian",
	// 	key: "it",
	// },
];

function App() {
	return (
		<div className="container">
			{languages?.map((language, index) => (
				<div key={index} className="my-5">
					<SpellChecker language={language} />
				</div>
			))}
		</div>
	);
}

export default App;
