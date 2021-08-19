import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { makeStyles } from "@material-ui/core/styles";
import userManager from "Components/users/userManager";
import { Grid, Button, CircularProgress } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import { ValidatorForm, TextValidator } from "react-material-ui-form-validator";
import { useDispatch, useStore } from "react-redux";
import { snackbarService } from "uno-material-ui";
import { LockFilled } from "@ant-design/icons";
import {
  AuthenticationApiFetchParamCreator,
  UserApiFetchParamCreator,
} from "api_calls/nodejsback";

import { loadStripe } from "@stripe/stripe-js/pure";
// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.

let stripePromise: any = {};

const useStyles = makeStyles((theme) => ({
  paperStyle: {
    padding: "10px",
    height: "70vh",
    width: "450px",
    margin: "20px auto",
  },
  avatarStyle: {
    background: "#00dffffc",
  },
  root: {
    width: "100%",
    "& > * + *": {
      marginTop: theme.spacing(2),
    },
  },
  textFieldWidth: {
    width: "100%",
  },
  nameHighlight: {
    backgroundColor: "#6666A9",
    color: "#ffffff",
    padding: "10px 5px 5px 5px",
    borderRadius: "20px 20px 0 0",
  },
  white: {
    color: "white",
  },

  price: {
    marginTop: 18,
    marginBottom: 18,
  },

  get: {
    backgroundColor: "#6666A9",
    border: "0px solid",
    fontSize: 16,
    padding: "8px 28px",
    color: "white",
    borderRadius: 5,
    fontWeight: 500,
  },

  plan: {
    border: "solid 1px #ddd",
    borderRadius: 20,
    paddingBottom: "30px",
  },
}));

export default function Plans(props: any) {
  const [userId, setUserId] = useState(null);
  const store = useStore();

  const isLoggedIn =
    Object.keys(
      useSelector((state: any) => {
        if (Object.keys(state).includes("user")) {
          if (Object.keys(state.user).includes("profile")) {
            return state.user.profile;
          }
        }
        return {};
      })
    ).length !== 0;

  const classes = useStyles();

  const createCheckoutSession = async (priceId: string, subType: string) => {
    return axios
      .post(
        "/create-checkout-session",
        {
          priceId: priceId,
          subscriptionType: subType,
          location: window.location.origin,
        },
        {
          headers: {
            Token: userManager.getToken(),
          },
        }
      )
      .then(function (result) {
        return result.data;
      });
  };

  const handleClick = async (price: string, subType: string) => {
    // Get Stripe.js instance
    const stripe = await stripePromise;

    // Call your backend to create the Checkout Session
    // const response = await fetch('/create-checkout-session', { method: 'POST' });
    createCheckoutSession(price, subType).then(function (data) {
      // Call Stripe.js method to redirect to the new Checkout page
      stripe.redirectToCheckout({ sessionId: data.sessionId }).then(() => {});
    });
  };

  useEffect(() => {
    stripePromise = loadStripe(
      "pk_test_51J7UfrFYFs5GcbAXBxHANlj0XASMfZV5TfxzkaKSDTTOeJTmlaIa60Uk5WlizFQ2JTSqZuhn9nJauzNGKmC1dR3700t0UTXOdy"
    );
  }, []);

  return (
    <Grid
      container
      alignContent="center"
      justify="center"
      style={{
        paddingTop: 30,
        paddingBottom: 50,
        paddingLeft: "4em",
        paddingRight: "4em",
      }}
    >
      <Grid
        container
        justify="center"
        direction="row"
        style={{
          backgroundColor: "#fafafa",
          padding: "20px 4em",
          borderRadius: 10,
          boxShadow: "1px 1px 1px 1px #ddd",
          border: "solid 1px #ddd",
          textAlign: "center",
          width: "75%",
        }}
      >
        <h1 style={{ marginBottom: 15 }}>Choose Your Plan</h1>

        <Grid
          spacing={5}
          container
          justify="center"
          direction="row"
          style={{
            backgroundColor: "#fafafa",
            padding: 20,
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <Grid item lg={4} md={4} sm={12} style={{ borderRadius: 1000 }}>
            <div className={classes.plan}>
              <div className={classes.nameHighlight}>
                <h2 className={classes.white}>Free</h2>
              </div>

              <div className={classes.price}>
                <h1>
                  0$
                  <span>/mo</span>
                </h1>
                <p>
                  10 experiments/month
                  <br></br>Public experiments
                </p>
              </div>
              {isLoggedIn ? (
                <Button
                  style={{ marginTop: 25 }}
                  color="primary"
                  variant="contained"
                  className={classes.get}
                  onClick={() =>
                    handleClick("price_1JCargFYFs5GcbAXZowQSPpK", "Free")
                  }
                >
                  Start Free!
                </Button>
              ) : (
                <NavLink to="/register">
                  <Button
                    style={{ marginTop: 25 }}
                    color="primary"
                    variant="contained"
                    className={classes.get}
                  >
                    Start Free!
                  </Button>
                </NavLink>
              )}
            </div>
          </Grid>

          <Grid item lg={4} md={4} sm={12} style={{ borderRadius: 1000 }}>
            <div className={classes.plan}>
              <div className={classes.nameHighlight}>
                <h2 className={classes.white}>Premium</h2>
                <span>Our Most Popular!</span>
              </div>

              <div className={classes.price}>
                <h1>
                  30$
                  <span>/mo</span>
                </h1>
                <p>
                  Unlimited experiments/month
                  <br></br>Private experiments
                </p>
              </div>
              {isLoggedIn ? (
                <Button
                  style={{ marginTop: 25 }}
                  color="primary"
                  variant="contained"
                  className={classes.get}
                  onClick={() =>
                    handleClick("price_1J7UmZFYFs5GcbAXvPronXSX", "Premium")
                  }
                >
                  Get Started!
                </Button>
              ) : (
                <NavLink to="/register">
                  <Button
                    style={{ marginTop: 25 }}
                    color="primary"
                    variant="contained"
                    className={classes.get}
                  >
                    Start Free!
                  </Button>
                </NavLink>
              )}
            </div>
          </Grid>

          <Grid item lg={4} md={4} sm={12} style={{ borderRadius: 1000 }}>
            <div className={classes.plan}>
              <div className={classes.nameHighlight}>
                <h2 className={classes.white}>Enterprise</h2>
              </div>

              <div className={classes.price}>
                <h1>
                  500$
                  <span>/mo</span>
                </h1>
                <p>
                  Unlimited experiments/month
                  <br></br>Private experiments
                  <br></br>
                  Custom Support!
                </p>
              </div>
              {isLoggedIn ? (
                <Button
                  style={{ marginTop: 25 }}
                  color="primary"
                  variant="contained"
                  className={classes.get}
                  onClick={() =>
                    handleClick("price_1JCapGFYFs5GcbAXGlbz4pJV", "Enterprise")
                  }
                >
                  Get Enterprise!
                </Button>
              ) : (
                <NavLink to="/register">
                  <Button
                    style={{ marginTop: 25 }}
                    color="primary"
                    variant="contained"
                    className={classes.get}
                  >
                    Start Free!
                  </Button>
                </NavLink>
              )}
            </div>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
