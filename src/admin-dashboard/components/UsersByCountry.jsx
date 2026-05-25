import { useEffect, useState } from "react";
import api from "../services/api";

export default function UsersByCountry() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/admin/users-by-country")
      .then((res) => setData(res.data))
      .catch((err) => console.log(err.response?.data));
  }, []);

  return (
    <div>
      <h2>Users by Country</h2>

      <ul>
        {data.map((item) => (
          <li key={item.country}>
            {item.country}: {item.count}
          </li>
        ))}
      </ul>
    </div>
  );
}





