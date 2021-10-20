import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import BrokenImageIcon from "@material-ui/icons/BrokenImage";
// import BrokenImageIcon from "@mui/icons-material/BrokenImage";

const ErrorComponent = (props: any) => {
  const history = useHistory();
  const [mainScreenError, setMainScreenError] = useState(false);
  const [appScreenError, setAppScreenError] = useState(false);

  useEffect(() => {
    let mainScreenError = props.location.state.mainScreen;
    debugger;
    setMainScreenError(mainScreenError);
    if (!mainScreenError) {
      setAppScreenError(true);
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 100,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
      }}
    >
      <div style={{ textAlign: "center" }}>
        {mainScreenError ? (
          <div>
            <div>
              <BrokenImageIcon
                style={{ width: 130, height: 130, color: "rgb(255 37 69)" }}
              ></BrokenImageIcon>
            </div>
            <div style={{ fontSize: 20, color: "#736464", fontWeight: 600 }}>
              <div>Server is down. We will be live shortly.</div>
              <div>For more information contact support@redmatterapp.com</div>
            </div>
          </div>
        ) : (
          <div>
            <div>
              <BrokenImageIcon
                style={{ width: 130, height: 130, color: "rgb(255 37 69)" }}
              ></BrokenImageIcon>
            </div>
            <div style={{ fontSize: 20, color: "#736464", fontWeight: 600 }}>
              <div>Something went wrong.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorComponent;
