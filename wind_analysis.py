import pandas as pd
import matplotlib.pyplot as plt
import argparse

def plot_wind_data(csv_file):
    # Load the CSV file
    df = pd.read_csv(csv_file)

    # Convert obsTimeLocal to datetime
    df["obsTimeLocal"] = pd.to_datetime(df["obsTimeLocal"])

    # Create a figure with two subplots
    fig, axes = plt.subplots(nrows=2, ncols=1, figsize=(12, 10))

    # Plot wind direction trends
    axes[0].plot(df["obsTimeLocal"], df["winddirHigh"], label="Wind Dir High", alpha=0.7)
    axes[0].plot(df["obsTimeLocal"], df["winddirAvg"], label="Wind Dir Avg", alpha=0.7)
    axes[0].plot(df["obsTimeLocal"], df["winddirLow"], label="Wind Dir Low", alpha=0.7)
    axes[0].set_xlabel("Time")
    axes[0].set_ylabel("Wind Direction (Degrees)")
    axes[0].set_title("Wind Direction Trends Over Time")
    axes[0].legend()
    axes[0].tick_params(axis='x', rotation=45)
    axes[0].grid()

    # Plot wind speed trends
    axes[1].plot(df["obsTimeLocal"], df["windspeedHigh"], label="Wind Speed High", alpha=0.7)
    axes[1].plot(df["obsTimeLocal"], df["windspeedAvg"], label="Wind Speed Avg", alpha=0.7)
    axes[1].plot(df["obsTimeLocal"], df["windspeedLow"], label="Wind Speed Low", alpha=0.7)
    axes[1].set_xlabel("Time")
    axes[1].set_ylabel("Wind Speed (km/h)")
    axes[1].set_title("Wind Speed Trends Over Time")
    axes[1].legend()
    axes[1].tick_params(axis='x', rotation=45)
    axes[1].grid()

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze and plot wind data from a CSV file.")
    parser.add_argument("csv_file", type=str, help="Path to the wind-history CSV file")
    args = parser.parse_args()

    plot_wind_data(args.csv_file)
