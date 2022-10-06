const SpellSuggestions = ({
	show,
	anchorPoint,
	selectedError,
	handleSuggestionClick,
	handleAddToDictionary,
	handleIgnore,
}) => {
	if (!show) return null;

	return (
		<div
			className="context-menu"
			style={{ top: anchorPoint?.y, left: anchorPoint?.x }}
		>
			{selectedError?.suggestions?.length > 0 ? (
				<ul className="menu-list">
					{selectedError?.suggestions?.map((suggestion, index) => (
						<li
							key={index}
							onClick={() => handleSuggestionClick(suggestion)}
						>
							{suggestion}
						</li>
					))}
				</ul>
			) : (
				<div className="text-center pt-2">
					<p>No suggestions</p>
				</div>
			)}

			<div className="menu-actions">
				<div className="d-grid gap-1">
					<button
						className="btn btn-outline  text-start"
						onClick={handleAddToDictionary}
					>
						<i className="fa-solid fa-spell-check"></i> Add to
						Dictionary
					</button>
					<button
						className="btn btn-outline  text-start"
						onClick={handleIgnore}
					>
						<i className="fa-solid fa-xmark"></i> Ignore
					</button>
				</div>
			</div>
		</div>
	);
};

export default SpellSuggestions;
