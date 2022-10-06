import axios from "axios";

export const fetchSuggestions = async (text, language, cancelToken) => {
	try {
		const formData = new FormData();

		formData.append("text", text);
		formData.append("lang", language);

		const { data } = await axios.post(
			"http://35.197.120.214:5000/api/v1/spell",
			formData,
			{
				cancelToken,
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);

		return data;
	} catch (error) {
		if (!axios.isCancel(error)) {
			console.error(error);
		}

		return false;
	}
};
