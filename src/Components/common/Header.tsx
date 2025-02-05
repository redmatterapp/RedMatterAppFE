import { useEffect } from "react";
import ReactGA from "react-ga";

import { NavLink } from "react-router-dom";

import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { useLocation } from "react-router";

import icon from "../../assets/images/white_icon.png";
import { useSelector } from "react-redux";

const useStyles = makeStyles((theme) => ({
  menuButton: {
    marginRight: theme.spacing(2),
  },
  headertitle: {
    flexGrow: 1,
    fontFamily: "Quicksand",
    fontWeight: 700,
    color: "white",
  },
  topBarLink: {
    color: "white",
    fontSize: 17,
    fontFamily: "Quicksand",
    fontWeight: 600,
    marginLeft: "10px",
    padding: 6,
    borderRadius: 3,
  },
  toolbar: {
    backgroundColor: "#333",
    textColor: "#fafafa",
    zIndex: 0,
  },
}));

const AppHeader = (props: any) => {
  const location = useLocation();

  const classes = useStyles();

  useEffect(() => {
    ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_ID);
    ReactGA.pageview(location.pathname);
  }, [location.pathname]);

  const renderHeader = () => {
    return (
      <div>
        <AppBar className={classes.toolbar} position="relative">
          <Toolbar>
            <Typography className={classes.headertitle}>
              <NavLink style={{ color: "#fafafa" }} to="/">
                <img
                  src={icon}
                  alt="Logo"
                  height="23"
                  style={{
                    marginRight: 7,
                    marginTop: -6,
                  }}
                />
                <b
                  style={{
                    fontFamily: "quicksand",
                    fontWeight: 400,
                    fontSize: 25,
                  }}
                >
                  {window.outerWidth > 500 ? "RED MATTER" : "RM"}
                </b>
                <b
                  style={{
                    fontFamily: "quicksand",
                    marginLeft: 5,
                    color: "#bbb",
                    fontWeight: 300,
                    fontSize: 15,
                  }}
                >
                  {"v2.0.1"}
                </b>
              </NavLink>
              <NavLink
                style={{
                  color: "#fafafa",
                  fontWeight: 600,
                  fontFamily: "quicksand",
                  fontSize: 25,
                  float: "right",
                  marginRight: "50px",
                }}
                to="/howtouse"
              >
                How To Use
              </NavLink>
              <NavLink
                style={{
                  color: "#fafafa",
                  fontWeight: 600,
                  fontFamily: "quicksand",
                  fontSize: 25,
                  float: "right",
                  marginRight: "50px",
                }}
                to="/integrate"
              >
                Integrate
              </NavLink>
            </Typography>
          </Toolbar>
        </AppBar>
      </div>
    );
  };

  // !location.pathname.includes("/workspace") &&
  return renderHeader();
};

export default AppHeader;
