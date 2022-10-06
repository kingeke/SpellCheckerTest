import axios from "axios";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { fetchSuggestions } from "../actions/FetchSuggestions";
import SpellCheckBlot from "./blots/SpellCheckBlot";
import SpellSuggestions from "./SpellSuggesstions";
import { generateRandomCharacters } from "../helpers";
import $ from "jquery";

const errorClassName = "spell-check-error";

export default function SpellChecker({ language }) {
	const quillRef = React.createRef();
	const componentRef = React.createRef();

	const [state, setState] = useState({
		spellcheckDisabled: false,
		text: "",
		errors: [],
		highlightedErrors: [],
		ignored: [],
		dictionary: [],
		showContextMenu: false,
		contextAnchorPoint: {},
		selectedError: null,
	});

	const handleStateUpdate = (payload) => {
		setState((old) => ({ ...old, ...payload }));
	};

	//endpoint to get data from server
	useEffect(() => {
		const cancelToken = axios.CancelToken.source();

		let timeout = setTimeout(() => {
			const fetchSuggestionsData = async () => {
				const errors = await fetchSuggestions(
					state.text,
					language.key,
					cancelToken.token
				);

				if (errors) {
					handleStateUpdate({ errors });
				}
			};

			if (state.text?.length > 1) {
				fetchSuggestionsData();
			}
		}, 2000);

		return () => {
			clearTimeout(timeout);
			cancelToken.cancel();
		};
		// eslint-disable-next-line
	}, [state.text, language]);

	const handleHideContextMenu = useCallback((e) => {
		if (e?.target?.className !== errorClassName) {
			handleStateUpdate({ showContextMenu: false });
		}
	}, []);

	//setup quill and register blots
	useEffect(() => {
		if (quillRef.current && !state.spellcheckDisabled) {
			const editor = quillRef.current.getEditor();

			editor?.root?.setAttribute("spellcheck", false);

			handleStateUpdate({ spellcheckDisabled: true });

			Quill.register(SpellCheckBlot);
		}
	}, [quillRef, state]);

	const handleChange = (text) => {
		handleStateUpdate({ text });
	};

	const handlePortalClick = useCallback(
		(node) => {
			if (!state.showContextMenu) {
				handleStateUpdate({
					showContextMenu: true,
					contextAnchorPoint: {
						x: node.pageX,
						y: node.pageY,
					},
					selectedError: state.highlightedErrors.find(
						(i) =>
							i.text.toLowerCase() ===
							node.target.innerText.toLowerCase()
					),
				});
			}
		},
		[state.highlightedErrors, state.showContextMenu]
	);

	useEffect(() => {
		if (state.showContextMenu) {
			document.addEventListener("click", handleHideContextMenu);
			document.addEventListener("contextmenu", handleHideContextMenu);
			return () => {
				document.removeEventListener("click", handleHideContextMenu);
				document.removeEventListener(
					"contextmenu",
					handleHideContextMenu
				);
			};
		}
	}, [state.showContextMenu, handleHideContextMenu, handlePortalClick]);

	const handleHighlightErrors = (errors) => {
		let contents = state.text;

		let highlightedErrors = state.highlightedErrors;

		errors.forEach((text) => {
			let id = `${text.original}_${generateRandomCharacters(30)}`;

			contents = contents.replace(
				new RegExp(text.original, "g"),
				`<span class="${errorClassName}" id="${id}">${text.original}</span>`
			);

			highlightedErrors.push({
				id,
				text: text.original,
				suggestions: text.suggestions,
			});
		});

		//fix to quill updating state before new content gets updated
		setTimeout(() => {
			handleStateUpdate({
				text: contents,
				highlightedErrors,
			});
		}, 500);
	};

	const handleRemoveHighlightedErrors = (noErrors) => {
		let contents = state.text;

		let highlightedErrors = state.highlightedErrors.filter(
			(item) => !noErrors.map((i) => i.id).includes(item.id)
		);

		noErrors.forEach((item) => {
			let regex = new RegExp(
				`<span class="${errorClassName}" id="${item.text}_.*?">(.*?)</span>`
			);

			let match = contents.match(regex, "gm")?.[1];

			if (match) {
				contents = contents.replace(regex, match);
			}
		});

		handleStateUpdate({ text: contents, highlightedErrors });
	};

	const handleSuggestionClick = (text) => {
		let { selectedError, text: contents, errors } = state;

		let regex = new RegExp(
			`<span class="${errorClassName}" id="${selectedError.text}_.*?">(.*?)</span>`
		);

		contents = contents.replace(regex, text);

		contents = contents.replace(new RegExp(selectedError.text), text);

		errors = errors.filter((i) => i.original !== selectedError.text);

		handleStateUpdate({
			text: contents,
			errors,
			selectedError: null,
		});
	};

	const handleAddToDictionary = () => {
		let dictionary = state.dictionary;

		dictionary.push(state.selectedError);

		handleStateUpdate({ dictionary });
	};

	const handleIgnore = () => {
		let ignored = state.ignored;

		ignored.push(state.selectedError);

		handleStateUpdate({ ignored });
	};

	const handleDisableDefaultContext = (e) => {
		e.preventDefault();
	};

	useEffect(() => {
		let node = $(componentRef?.current);

		if (!node.attr("registeredEvents")) {
			node.attr("registeredEvents", "true");

			["click", "contextmenu"].forEach((ev) => {
				$(componentRef.current).on(ev, `.${errorClassName}`, (e) =>
					handlePortalClick(e)
				);
			});

			$(componentRef.current).on(
				"mouseenter",
				`.${errorClassName}`,
				() => {
					document.addEventListener(
						"contextmenu",
						handleDisableDefaultContext
					);
				}
			);

			$(componentRef.current).on(
				"mouseleave",
				`.${errorClassName}`,
				() => {
					document.removeEventListener(
						"contextmenu",
						handleDisableDefaultContext
					);
				}
			);
		}
		// eslint-disable-next-line
	}, []);

	//handles text highlighting
	useEffect(() => {
		let contents = state.text;

		if (!contents) return;

		let errors = state.errors.filter(
			(text) =>
				!state.highlightedErrors
					.map((i) => i.text)
					.includes(text.original) &&
				!state.dictionary.map((i) => i.text).includes(text.original) &&
				!state.ignored.map((i) => i.text).includes(text.original)
		);

		if (errors.length > 0) {
			handleHighlightErrors(errors);
		}

		let noErrors = state.highlightedErrors.filter(
			(item) => !state.errors.map((i) => i.original).includes(item.text)
		);

		noErrors = [...noErrors, ...state.dictionary, ...state.ignored];

		if (noErrors.length > 0) {
			handleRemoveHighlightedErrors(noErrors);
		}
		// eslint-disable-next-line
	}, [state.errors.length, state.dictionary.length, state.ignored.length]);

	return (
		<div ref={componentRef} className="list-elements my-3">
			<h5>{`${language?.name} Editor`}</h5>
			<ReactQuill
				ref={quillRef}
				name="text"
				theme="snow"
				value={state.text}
				onChange={handleChange}
			></ReactQuill>
			<SpellSuggestions
				show={state.showContextMenu}
				anchorPoint={state.contextAnchorPoint}
				selectedError={state.selectedError}
				handleSuggestionClick={handleSuggestionClick}
				handleAddToDictionary={handleAddToDictionary}
				handleIgnore={handleIgnore}
			/>
		</div>
	);
}

SpellChecker.propTypes = {
	language: PropTypes.shape({
		name: PropTypes.string,
		key: PropTypes.string,
	}),
};
