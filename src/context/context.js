import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
	const [githubUser, setGithubUser] = useState(mockUser);
	const [repos, setRepos] = useState(mockRepos);
	const [followers, setFollowers] = useState(mockFollowers);

	// Remaining requests
	const [requests, setRequests] = useState(0);

	// Loading, Error
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState({ show: false, msg: "" });

	// Search
	const searchGithubUser = async (user) => {
		toggleError();
		setIsLoading(true);
		const response = await axios(`${rootUrl}/users/${user}`).catch((error) => {
			console.log(error);
		});

		if (response) {
			setGithubUser(response.data);
			const { repos_url, followers_url } = response.data;

			await Promise.allSettled([
				axios(`${repos_url}?per_page=100`),
				axios(`${followers_url}?per_page=100`),
			])
				.then((results) => {
					const [repos, followers] = results;
					const status = "fulfilled";
					if (repos.status === status) {
						setRepos(repos.value.data);
					}
					if (followers.status === status) {
						setFollowers(followers.value.data);
					}
				})
				.catch((err) => console.log(err));
		} else {
			toggleError(true, "username doesn't exist");
		}
		checkRequests();
		setIsLoading(false);
	};

	const checkRequests = () => {
		axios(`${rootUrl}/rate_limit`)
			.then(({ data }) => {
				let {
					rate: { remaining },
				} = data;

				setRequests(remaining);

				// Out of requests
				if (remaining === 0) {
					toggleError(true, "sorry... No requests remaining!");
				}
			})
			.catch((err) => console.log(err));
	};

	// Toggle error
	function toggleError(show = false, msg = "") {
		setError({ show, msg });
	}

	useEffect(checkRequests, []);

	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				followers,
				requests,
				error,
				searchGithubUser,
				isLoading,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};

export { GithubContext, GithubProvider };
