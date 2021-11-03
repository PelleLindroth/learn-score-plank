import React, { useRef, useState } from 'react'
import * as Sentry from "@sentry/react"
import { Integrations } from "@sentry/tracing"
import LogRocket from 'logrocket'
import { Link, Route } from "wouter"
import './App.css'
import { set, update, ref, getDatabase } from "firebase/database"
import { useObject } from 'react-firebase-hooks/database'

Sentry.init({
	dsn: "https://97e11c6520e24d4795fa3df3f18b9653@o1058241.ingest.sentry.io/6045734",
	integrations: [new Integrations.BrowserTracing()],

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
})

LogRocket.init('iw1mxc/score-plank')

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyCL-GumA8WiQzXpsVYOru3mcay9ZYP60-c",
	authDomain: "score-plank-ee749.firebaseapp.com",
	databaseURL: "https://score-plank-ee749-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "score-plank-ee749",
	storageBucket: "score-plank-ee749.appspot.com",
	messagingSenderId: "3948981612",
	appId: "1:3948981612:web:89a7af971a762c08c71749"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

function App() {

	return (
		<div className="App">
			<Route path="/">
				<StartPage />
			</Route>
			<Route path="/score">
				<ScorePage />
			</Route>
			<Route path="/judge">
				<JudgePage />
			</Route>
		</div>
	)
}

const StartPage = () => {
	return (
		<div className="start-page">
			<Link href="/score">
				<a className="link fs8 fw4">Score view</a>
			</Link>
			<div className="fs5">Open this on your TV</div>
			<div className="h15"></div>
			<Link href="/judge">
				<a className="link fs8 fw4">Judge view</a>
			</Link>
			<div className="fs5">Let the judge open this on their smartphone</div>
		</div>
	)
}

const ScorePage = () => {
	const [snapshot, loading, error] = useObject(ref(database))

	return (
		<div className="score-page">
			<div className="player-score">
				<div className="score blue">{snapshot?.val().player1.score}</div>
				<div className="player blue">{snapshot?.val().player1.name}</div>
			</div>
			<div className="player-score">
				<div className="score red">{snapshot?.val().player2.score}</div>
				<div className="player red">{snapshot?.val().player2.name}</div>
			</div>
		</div>
	)
}

const JudgePage = () => {
	const [settingNames, setSettingNames] = React.useState(false)
	const [player1Name, setPlayer1Name] = useState('')
	const [player2Name, setPlayer2Name] = useState('')
	const [snapshot, loading, error] = useObject(ref(database))

	const pl1input = useRef(null)
	const pl2input = useRef(null)

	const db = getDatabase()

	if (error) { return <p>Could not connect to database. Try reloading the page</p> }
	if (loading) { return <p>Loading...</p> }

	const data = snapshot.val()

	const changeScore = (key, amount) => {
		if (data[`player${key}`].score < 1 && amount < 0) { return }

		if (data[`player${key}`].score > 19 && amount > 0) {
			throw new Error('Score too high!')
		}

		set(ref(db, `player${key}/score`), data[`player${key}`].score + amount)
	}

	const resetScore = () => {
		set(ref(db, 'player1/score'), 0)
		set(ref(db, 'player2/score'), 0)
	}

	const setPlayerNames = () => {
		setPlayer1Name(data.player1.name)
		setPlayer2Name(data.player2.name)
		setSettingNames(true)
	}

	const savePlayerNames = () => {
		const updates = {
			'player1/name': player1Name,
			'player2/name': player2Name,
		}

		update(ref(db), updates)
		setSettingNames(false)
	}

	const switchSides = () => {
		if (pl1input.current.className.includes('blue')) {
			pl1input.current.className = 'ju-player-row ju-red'
			pl2input.current.className = 'ju-player-row ju-blue'
		} else {
			pl1input.current.className = 'ju-player-row ju-blue'
			pl2input.current.className = 'ju-player-row ju-red'
		}

		const updates = {
			'player1': data.player2,
			'player2': data.player1,
		}

		update(ref(db), updates)
	}

	if (settingNames) {
		return (
			<div className="judge-page">
				<div className="ju-name-row ju-name-row-blue">
					<input onChange={(e) => setPlayer1Name(e.target.value)} className="ju-input" type="text" value={player1Name} />
				</div>
				<div className="ju-name-row ju-name-row-red">
					<input onChange={(e) => setPlayer2Name(e.target.value)} className="ju-input" type="text" value={player2Name} />
				</div>
				<div className="settings-row">
					<div onClick={() => setSettingNames(false)} className="ju-set">Cancel</div>
					<div onClick={savePlayerNames} className="ju-set">Save</div>
				</div>
			</div>
		)
	}

	return (
		<div className="judge-page">
			<div ref={pl1input} className="ju-player-row ju-blue">
				<div onClick={() => changeScore(1, -1)} className="ju-minus">-</div>
				<div className="ju-player">
					<div className="ju-points">{data.player1.score}</div>
					<div className="ju-name">{data.player1.name}</div>
				</div>
				<div onClick={() => changeScore(1, 1)} className="ju-plus">+</div>
			</div>
			<div ref={pl2input} className="ju-player-row ju-red">
				<div onClick={() => changeScore(2, -1)} className="ju-minus">-</div>
				<div className="ju-player">
					<div className="ju-points">{data.player2.score}</div>
					<div className="ju-name">{data.player2.name}</div>
				</div>
				<div onClick={() => changeScore(2, 1)} className="ju-plus">+</div>
			</div>
			<div className="settings-row">
				<div onClick={setPlayerNames} className="ju-set">Set player names</div>
				<div onClick={resetScore} className="ju-set">Reset score</div>
				<div onClick={switchSides} className="ju-set">Switch sides</div>
			</div>
		</div>
	)
}

export default App







