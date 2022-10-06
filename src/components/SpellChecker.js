import axios from "axios";
import { uniqueId } from "lodash";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { fetchSuggestions } from "../actions/FetchSuggestions";
import SpellCheckBlot from "./blots/SpellCheckBlot";

export default function SpellChecker({ language }) {
	const quillRef = React.createRef();

	const [state, setState] = useState({
		spellcheckDisabled: false,
		text: "don't you worry don't you worry now heavn got a plna for you ",
		errors: [],
		highlightedErrors: [],
		ignored: [],
		dictionary: [],
	});

	//endpoint to get data from server
	useEffect(() => {
		const cancelToken = axios.CancelToken.source();

		let timeout = setTimeout(() => {
			const fetchSuggestionsData = async () => {
				const result = await fetchSuggestions(
					state.text,
					language.key,
					cancelToken.token
				);

				handleStateUpdate({ errors: result });
			};

			if (state.text?.length > 1) {
				fetchSuggestionsData();
			}
		}, 2000);

		return () => {
			clearTimeout(timeout);
			cancelToken.cancel();
		};
	}, [state.text, language]);

	//setup quill and register blots
	useEffect(() => {
		if (quillRef.current && !state.spellcheckDisabled) {
			const editor = quillRef.current.getEditor();

			editor?.root?.setAttribute("spellcheck", false);

			handleStateUpdate({ spellcheckDisabled: true });

			Quill.register(SpellCheckBlot);
		}
	}, [quillRef, state]);

	const handleStateUpdate = (payload) => {
		setState((old) => ({ ...old, ...payload }));
	};

	const handleChange = (text) => {
		handleStateUpdate({ text });
	};

	const handlePortalClick = (text) => {
		console.log("portal click");
		console.log(text);
	};

	useEffect(() => {
		if (state.highlightedErrors.length > 0) {
			state.highlightedErrors.forEach((item) => {
				let element = document.getElementById(item.id);
				if (element && !element.hasAttribute("eventListenerAdded")) {
					element.setAttribute("eventListenerAdded", "true");
					element.addEventListener("click", (e) =>
						handlePortalClick(e)
					);
				}
			});
		}
		// eslint-disable-next-line
	}, [state.highlightedErrors.length]);

	//handles text highlighting
	useEffect(() => {
		let contents = state.text;

		if (!contents) return;

		let errors = state.errors.filter(
			(text) =>
				!state.highlightedErrors
					.map((i) => i.text)
					.includes(text.original)
		);

		if (errors.length > 0) {
			let highlightedErrors = state.highlightedErrors;

			errors.forEach((text) => {
				let id = uniqueId(`${text.original}_`);

				contents = contents.replace(
					new RegExp(text.original, "g"),
					`<span class="spell-check-error" id="${id}">${text.original}</span>`
				);

				highlightedErrors.push({
					id,
					text: text.original,
				});
			});

			handleStateUpdate({
				text: contents,
				highlightedErrors,
			});
		}

		state.highlightedErrors
			.filter(
				(item) =>
					!state.errors.map((i) => i.original).includes(item.text)
			)
			.forEach((item) => {
				let regex = new RegExp(
					`<span class="spell-check-error" id="${item.text}_.*?">(.*?)</span>`
				);

				let match = contents.match(regex, "gm")?.[1];

				contents = contents.replace(regex, match);

				let highlightedErrors = state.highlightedErrors.filter(
					(i) => i.id !== item.id
				);

				handleStateUpdate({ text: contents, highlightedErrors });
			});
		// eslint-disable-next-line
	}, [state.errors]);

	console.log(state);

	return (
		<div className="my-3">
			<h5>{`${language?.name} Editor`}</h5>
			<ReactQuill
				ref={quillRef}
				name="text"
				theme="snow"
				value={state.text}
				onChange={handleChange}
			></ReactQuill>
		</div>
	);
}

SpellChecker.propTypes = {
	language: PropTypes.shape({
		name: PropTypes.string,
		key: PropTypes.string,
	}),
};
